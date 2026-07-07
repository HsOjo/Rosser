import xml.etree.ElementTree as ET
from io import BytesIO

from defusedxml import ElementTree as DefusedET

from app.models import Category, Subscription


class OPMLService:
    @staticmethod
    def export(subscriptions: list[Subscription], categories: list[Category]) -> bytes:
        root = ET.Element("opml", version="2.0")
        head = ET.SubElement(root, "head")
        ET.SubElement(head, "title").text = "Rosser Subscriptions"
        body = ET.SubElement(root, "body")

        cat_map: dict[str | None, list[Subscription]] = {}
        for sub in subscriptions:
            cat_map.setdefault(sub.category_id, []).append(sub)

        for cat in categories:
            outline = ET.SubElement(body, "outline", text=cat.title or "Untitled")
            for sub in cat_map.get(cat.id, []):
                ET.SubElement(outline, "outline", text=sub.title or "Untitled", type="rss", xmlUrl=sub.url)

        for sub in cat_map.get(None, []):
            ET.SubElement(body, "outline", text=sub.title or "Untitled", type="rss", xmlUrl=sub.url)

        tree = ET.ElementTree(root)
        buf = BytesIO()
        tree.write(buf, encoding="utf-8", xml_declaration=True)
        return buf.getvalue()

    @staticmethod
    def parse(content: bytes) -> list[dict]:
        tree = DefusedET.fromstring(content)
        results: list[dict] = []

        def walk(element, category_title: str | None = None):
            for child in element.findall("outline"):
                xml_url = child.get("xmlUrl")
                if xml_url:
                    results.append({
                        "title": child.get("text") or child.get("title") or None,
                        "url": xml_url,
                        "category": category_title,
                    })
                else:
                    walk(child, child.get("text") or child.get("title") or category_title)

        body = tree.find("body")
        if body is not None:
            walk(body)
        return results
