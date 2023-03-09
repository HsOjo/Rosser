import webview


def get_title(window: 'webview.Window'):
    title = window.title

    titles = window.get_elements('title')  # type: list
    if titles:
        title = titles.pop().get('text') or title

    return title
