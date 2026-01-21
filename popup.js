let selectedStyle = "yellow";

// Style selection
document.querySelectorAll(".style-option").forEach((option) => {
  option.addEventListener("click", function () {
    document.querySelectorAll(".style-option").forEach((opt) => {
      opt.classList.remove("selected");
    });
    this.classList.add("selected");
    selectedStyle = this.dataset.style;
  });
});

// Load and display watched strings
function loadWatchList() {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    const watchList = result.watchedStrings || [];
    displayWatchList(watchList);
  });
}

function displayWatchList(watchList) {
  const container = document.getElementById("listContent");
  container.innerHTML = "";

  if (watchList.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No strings being watched</div>';
    return;
  }

  watchList.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "watched-item";
    itemDiv.innerHTML = `
      <span class="watched-text style-${item.style}">${item.text}</span>
      <button class="remove-btn" data-text="${item.text}">Remove</button>
    `;
    container.appendChild(itemDiv);
  });

  // Add remove listeners
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      removeString(this.dataset.text);
    });
  });
}

function addString(text, style) {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    const watchList = result.watchedStrings || [];

    // Check if string already exists
    const exists = watchList.some((item) => item.text === text);

    if (!exists) {
      watchList.push({ text, style });
      chrome.storage.local.set({ watchedStrings: watchList }, function () {
        loadWatchList();
        document.getElementById("stringInput").value = "";
      });
    }
  });
}

function removeString(text) {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    let watchList = result.watchedStrings || [];
    watchList = watchList.filter((item) => item.text !== text);
    chrome.storage.local.set({ watchedStrings: watchList }, function () {
      loadWatchList();
    });
  });
}

// Event listeners
document.getElementById("addBtn").addEventListener("click", function () {
  const text = document.getElementById("stringInput").value.trim();
  if (text) {
    addString(text, selectedStyle);
  }
});

document
  .getElementById("stringInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const text = this.value.trim();
      if (text) {
        addString(text, selectedStyle);
      }
    }
  });

// Load on popup open
loadWatchList();
