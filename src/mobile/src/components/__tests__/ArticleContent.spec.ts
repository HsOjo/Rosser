import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { nextTick } from "vue";
import ArticleContent from "@/components/ArticleContent.vue";
import HtmlRender from "@/components/render/HtmlRender.vue";
import PlainTextRender from "@/components/render/PlainTextRender.vue";
import UnsupportedRender from "@/components/render/UnsupportedRender.vue";
import ImagePreviewOverlay from "@/components/render/ImagePreviewOverlay.vue";
import zhCN from "@/locales/zh-CN.json";
import en from "@/locales/en.json";

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: "zh-CN",
    fallbackLocale: "en",
    messages: { "zh-CN": zhCN, en },
  });
}

function setupPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

describe("ArticleContent", () => {
  beforeEach(() => {
    setupPinia();
  });

  it("renders different renderers based on content type", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ArticleContent, {
      props: {
        content: [
          { type: "text/html", value: "<p>hello</p>" },
          { type: "text/plain", value: "plain text" },
          { type: "application/pdf", value: "ignored" },
        ],
      },
      global: { plugins: [i18n, setupPinia()] },
    });

    await flushPromises();

    expect(wrapper.findComponent(HtmlRender).exists()).toBe(true);
    expect(wrapper.findComponent(PlainTextRender).exists()).toBe(true);
    expect(wrapper.findComponent(UnsupportedRender).exists()).toBe(true);
    expect(wrapper.findComponent(UnsupportedRender).text()).toContain(
      "application/pdf",
    );
  });

  it("emits merged headings from html blocks", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ArticleContent, {
      props: {
        content: [
          { type: "text/html", value: "<h1>First</h1>" },
          { type: "text/html", value: "<h2>Second</h2>" },
        ],
      },
      global: { plugins: [i18n, setupPinia()] },
    });

    await flushPromises();
    await nextTick();

    const events = wrapper.emitted("update:headings");
    expect(events).toBeTruthy();
    const last = events![events!.length - 1] as [Array<{ id: string; text: string; level: number }>];
    expect(last[0]).toHaveLength(2);
    expect(last[0][0].text).toBe("First");
    expect(last[0][1].text).toBe("Second");
  });

  it("opens image preview when image is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ArticleContent, {
      props: {
        content: [
          {
            type: "text/html",
            value: '<p><img src="img1.jpg" /><img src="img2.jpg" /></p>',
          },
        ],
      },
      global: { plugins: [i18n, setupPinia()] },
    });

    await flushPromises();

    const imgs = wrapper.findAll("img");
    expect(imgs).toHaveLength(2);
    await imgs[1].trigger("click");
    await nextTick();

    const overlay = wrapper.findComponent(ImagePreviewOverlay);
    expect(overlay.props("images")).toEqual(["img1.jpg", "img2.jpg"]);
    expect(overlay.props("initialIndex")).toBe(1);
    expect(overlay.props("modelValue")).toBe(true);
  });

  it("exposes preview state and close method", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ArticleContent, {
      props: {
        content: [
          { type: "text/html", value: '<p><img src="img.jpg" /></p>' },
        ],
      },
      global: { plugins: [i18n, setupPinia()] },
    });

    await flushPromises();
    await wrapper.find("img").trigger("click");
    await nextTick();

    expect(wrapper.vm.isPreviewOpen).toBe(true);
    wrapper.vm.closePreview();
    await nextTick();
    expect(wrapper.vm.isPreviewOpen).toBe(false);
  });
});

describe("HtmlRender", () => {
  it("renders headings and paragraphs and emits headings", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(HtmlRender, {
      props: { html: "<h1>Title</h1><p>Body</p>", blockIndex: 0 },
      global: { plugins: [i18n] },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.find("h1").text()).toBe("Title");
    expect(wrapper.find("p").text()).toBe("Body");
    expect(wrapper.emitted("update:headings")?.[0]).toEqual([
      [{ id: "heading-0-0", level: 1, text: "Title" }],
    ]);
  });

  it("emits preview with image group when an image is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(HtmlRender, {
      props: { html: '<img src="a.jpg"/><img src="b.jpg"/>', blockIndex: 0 },
      global: { plugins: [i18n] },
    });

    await flushPromises();
    await nextTick();

    await wrapper.findAll("img")[1].trigger("click");
    expect(wrapper.emitted("preview")?.[0]).toEqual([
      { images: ["a.jpg", "b.jpg"], index: 1 },
    ]);
  });

  it("prevents image click inside a link from triggering the link", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(HtmlRender, {
      props: { html: '<a href="https://example.com"><img src="a.jpg"/></a>', blockIndex: 0 },
      global: { plugins: [i18n] },
    });

    await flushPromises();
    await nextTick();

    const anchor = wrapper.find("a").element;
    const anchorClickSpy = vi.fn();
    anchor.addEventListener("click", anchorClickSpy);

    await wrapper.find("img").trigger("click");
    expect(wrapper.emitted("preview")?.[0]).toEqual([
      { images: ["a.jpg"], index: 0 },
    ]);
    expect(anchorClickSpy).not.toHaveBeenCalled();

    anchor.removeEventListener("click", anchorClickSpy);
  });

  it("limits image max height to 50% of viewport", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(HtmlRender, {
      props: { html: '<img src="a.jpg"/>', blockIndex: 0 },
      global: { plugins: [i18n] },
    });

    await flushPromises();
    await nextTick();

    const img = wrapper.find("img");
    expect(img.classes()).toContain("max-h-[50dvh]");
  });

  it("marks external links with target=_blank", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(HtmlRender, {
      props: { html: '<a href="https://example.com">Link</a>' },
      global: { plugins: [i18n] },
    });

    await flushPromises();
    await nextTick();

    const link = wrapper.find("a");
    expect(link.attributes("href")).toBe("https://example.com");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
  });
});

describe("ImagePreviewOverlay", () => {
  it("shows counter and navigates images", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ImagePreviewOverlay, {
      props: {
        modelValue: true,
        images: ["a.jpg", "b.jpg", "c.jpg"],
        initialIndex: 1,
      },
      global: { plugins: [i18n] },
    });

    await nextTick();

    expect(wrapper.text()).toContain("2 / 3");
    expect(wrapper.find("img").attributes("src")).toBe("b.jpg");

    await wrapper.find("button[aria-label='next']").trigger("click");
    await nextTick();
    expect(wrapper.find("img").attributes("src")).toBe("c.jpg");
    expect(wrapper.text()).toContain("3 / 3");

    await wrapper.find("button[aria-label='previous']").trigger("click");
    await wrapper.find("button[aria-label='previous']").trigger("click");
    await nextTick();
    expect(wrapper.find("img").attributes("src")).toBe("a.jpg");
    expect(wrapper.text()).toContain("1 / 3");
  });

  it("closes on backdrop click", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ImagePreviewOverlay, {
      props: { modelValue: true, images: ["a.jpg"], initialIndex: 0 },
      global: { plugins: [i18n] },
    });

    await wrapper.find("div.fixed").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });
});
