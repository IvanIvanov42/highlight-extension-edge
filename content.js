let watchedStrings = [];

// Load watched strings from storage
function loadWatchedStrings() {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    watchedStrings = result.watchedStrings || [];
    console.log("Loaded watched strings:", watchedStrings);
    highlightMatches();
  });
}

// Highlight all matching text on the page
function highlightMatches() {
  if (watchedStrings.length === 0) return;

  // Remove existing highlights first
  document.querySelectorAll(".string-highlight").forEach((el) => {
    el.classList.remove("string-highlight");
  });

  // Search through all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false,
  );

  let node;
  const nodesToHighlight = [];

  while ((node = walker.nextNode())) {
    const text = node.textContent;

    // Check if any watched string is in this text
    for (let watchedString of watchedStrings) {
      if (text.includes(watchedString)) {
        nodesToHighlight.push(node);
        break;
      }
    }
  }

  // Highlight the parent elements
  nodesToHighlight.forEach((node) => {
    if (node.parentElement) {
      node.parentElement.classList.add("string-highlight");
    }
  });

  console.log(`Highlighted ${nodesToHighlight.length} elements`);
}

// Watch for DOM changes
const observer = new MutationObserver(function (mutations) {
  highlightMatches();
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Listen for storage changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.watchedStrings) {
    loadWatchedStrings();
  }
});

// Initial load
loadWatchedStrings();
console.log("String Highlighter extension loaded");
