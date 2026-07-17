import sys
from pathlib import Path


def _get_version_file() -> Path:
    # PyInstaller sets sys._MEIPASS to the extraction directory and bundles
    # VERSION at the root of that directory.
    if getattr(sys, "frozen", False):
        meipass = getattr(sys, "_MEIPASS", None)
        if meipass:
            return Path(meipass) / "VERSION"
    # Development path: version.py is at src/backend/app/core/version.py
    return Path(__file__).resolve().parents[4] / "VERSION"


APP_VERSION = _get_version_file().read_text().strip()
GITHUB_OWNER = "HsOjo"
GITHUB_REPO = "Rosser"
RELEASES_URL = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases"
