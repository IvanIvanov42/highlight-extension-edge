// Load and display watched strings
function loadWatchList() {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    const watchList = result.watchedStrings || [];
    displayWatchList(watchList);
  });
}

function displayWatchList(watchList) {
  const container = document.getElementById("watchList");
  container.innerHTML = "";

  if (watchList.length === 0) {
    container.innerHTML =
      '<p style="color: #666; font-size: 14px;">No strings being watched</p>';
    return;
  }

  watchList.forEach((str) => {
    const item = document.createElement("div");
    item.className = "watched-item";
    item.innerHTML = `
      <span>${str}</span>
      <button class="remove-btn" data-string="${str}">Remove</button>
    `;
    container.appendChild(item);
  });

  // Add remove listeners
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      removeString(this.dataset.string);
    });
  });
}

function addString(str) {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    const watchList = result.watchedStrings || [];

    if (!watchList.includes(str)) {
      watchList.push(str);
      chrome.storage.local.set({ watchedStrings: watchList }, function () {
        loadWatchList();
        document.getElementById("stringInput").value = "";
      });
    }
  });
}

function removeString(str) {
  chrome.storage.local.get(["watchedStrings"], function (result) {
    let watchList = result.watchedStrings || [];
    watchList = watchList.filter((item) => item !== str);
    chrome.storage.local.set({ watchedStrings: watchList }, function () {
      loadWatchList();
    });
  });
}

// Event listeners
document.getElementById("addBtn").addEventListener("click", function () {
  const str = document.getElementById("stringInput").value.trim();
  if (str) {
    addString(str);
  }
});

document
  .getElementById("stringInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const str = this.value.trim();
      if (str) {
        addString(str);
      }
    }
  });

// Load on popup open
loadWatchList();
