try {
  chrome.devtools.panels.create(
    "Dev Tools",
    "icon-34.svg",
    "src/pages/panel/index.html"
  );
} catch (e) {
  console.error(e);
}
