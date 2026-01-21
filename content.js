let watchedStrings = [];
let observer = null;
let isHighlighting = false;

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
  if (isHighlighting) return;

  isHighlighting = true;

  if (observer) {
    observer.disconnect();
  }

  if (watchedStrings.length === 0) {
    removeAllHighlights();
    reconnectObserver();
    isHighlighting = false;
    return;
  }

  // Process all text nodes
  processTextNodes(document.body);

  console.log("Highlighting complete");

  reconnectObserver();
  isHighlighting = false;
}

// Process text nodes in a given element
function processTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        // Skip script, style elements, and already highlighted elements
        const parent = node.parentElement;
        if (
          !parent ||
          parent.tagName === "SCRIPT" ||
          parent.tagName === "STYLE" ||
          parent.classList.contains("string-highlight")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false,
  );

  let node;
  const nodesToProcess = [];

  while ((node = walker.nextNode())) {
    const text = node.textContent;
    const textLower = text.toLowerCase();

    // Check if any watched string is in this text
    for (let watchedString of watchedStrings) {
      if (textLower.includes(watchedString.toLowerCase())) {
        nodesToProcess.push({ node, watchedString });
        break;
      }
    }
  }

  // Process nodes
  nodesToProcess.forEach(({ node, watchedString }) => {
    highlightTextInNode(node, watchedString);
  });
}

function highlightTextInNode(textNode, searchString) {
  if (!textNode.parentNode) return;

  const text = textNode.textContent;
  const textLower = text.toLowerCase();
  const searchLower = searchString.toLowerCase();

  let startIndex = 0;
  const fragments = [];

  // Find all occurrences
  while (true) {
    const index = textLower.indexOf(searchLower, startIndex);
    if (index === -1) {
      if (startIndex < text.length) {
        fragments.push(document.createTextNode(text.substring(startIndex)));
      }
      break;
    }

    // Text before match
    if (index > startIndex) {
      fragments.push(
        document.createTextNode(text.substring(startIndex, index)),
      );
    }

    // Highlighted match
    const matchedText = text.substring(index, index + searchString.length);
    const span = document.createElement("span");
    span.className = "string-highlight";
    span.textContent = matchedText;
    fragments.push(span);

    startIndex = index + searchString.length;
  }

  // Replace if we found matches
  if (fragments.length > 1) {
    const parent = textNode.parentNode;
    fragments.forEach((fragment) => {
      parent.insertBefore(fragment, textNode);
    });
    parent.removeChild(textNode);
  }
}

function removeAllHighlights() {
  document.querySelectorAll(".string-highlight").forEach((span) => {
    const parent = span.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(span.textContent), span);
      parent.normalize();
    }
  });
}

function reconnectObserver() {
  if (observer) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Create observer that only processes new nodes
observer = new MutationObserver(function (mutations) {
  if (isHighlighting || watchedStrings.length === 0) return;

  isHighlighting = true;
  observer.disconnect();

  // Only process added nodes, not the entire page
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        processTextNodes(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const textLower = text.toLowerCase();

        for (let watchedString of watchedStrings) {
          if (textLower.includes(watchedString.toLowerCase())) {
            highlightTextInNode(node, watchedString);
            break;
          }
        }
      }
    });
  });

  reconnectObserver();
  isHighlighting = false;
});

// Start observing
reconnectObserver();

// Listen for storage changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.watchedStrings) {
    loadWatchedStrings();
  }
});

// Initial load
loadWatchedStrings();
console.log("String Highlighter extension loaded");
