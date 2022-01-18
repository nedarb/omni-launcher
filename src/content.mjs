import actions from "./actions.mjs";

import {
  html,
  render,
  Component,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "./standalone.mjs";
import useDebounce from "./useDebounce.mjs";

const CloseOmniAction = "close-omni";

const Commands = [
  {
    title: "History",
    desc: "Search browsing history",
    type: "command",
    shortcut: "/history",
  },
  {
    title: "Tabs",
    desc: "Search your open tabs",
    type: "command",
    shortcut: "/tabs",
  },
  {
    title: "Bookmarks",
    desc: "Search bookmarks",
    type: "command",
    shortcut: "/bookmarks",
    emoji: true,
    emojiChar: "📕",
  },
  {
    title: "Actions",
    desc: "Search actions",
    type: "command",
    shortcut: "/actions",
  },
];

function OmniItem({ action, index, handleAction, isSelected }) {
  const ref = useRef(null);
  const handleClick = useCallback(
    (e) => {
      e.preventDefault(true);
      handleAction && handleAction(action, e);
    },
    [action, handleAction]
  );
  useEffect(() => {
    if (isSelected) {
      ref?.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [ref, isSelected]);
  var keys = "";
  if (action.keycheck) {
    keys = html`<div class="omni-keys">
      ${action.keys.map(function (key) {
        return html`<span key=${key} class="omni-shortcut">${key}</span>`;
      })}
    </div>`;
  }
  const imgUrl =
    action.favIconUrl || chrome.runtime.getURL("/assets/globe.svg");
  var img = html`<img
    src="${imgUrl}"
    class="omni-icon"
    alt="${action.title}"
  />`;
  if (action.emoji) {
    img = html`<span class="omni-emoji-action">${action.emojiChar}</span>`;
  }

  return html`<a
    href="#"
    ref=${ref}
    class="omni-item ${isSelected ? "omni-item-active" : ""}"
    data-type="${action.type}"
    data-url="${action.url}"
    onClick=${handleClick}
  >
    ${img}
    <div class="omni-item-details">
      <div class="omni-item-name">${action.title}</div>
      <div class="omni-item-desc">${action.url || action.shortcut}</div>
    </div>
    ${keys}
    <div class="omni-select">Select <span class="omni-shortcut">⏎</span></div>
  </a>`;
}

function handleAction(action, eventOptions) {
  const openUrl = (url = action.url) =>
    eventOptions?.metaKey ? window.open(url) : window.open(url, "_self");
  switch (action.action) {
    case "scroll-bottom":
      window.scrollTo(0, document.body.scrollHeight);
      break;
    case "scroll-top":
      window.scrollTo(0, 0);
      break;
    case "url":
    case "bookmark":
    case "navigation":
      openUrl();
      break;
    case "fullscreen":
      var elem = document.documentElement;
      elem.requestFullscreen();
      break;
    case "new-tab":
      window.open("");
      break;
    case "email":
      window.open("mailto:");
      break;
    case CloseOmniAction:
      console.debug(`Closing Omni`);
      break;
    default:
      console.error(`NO HANDLER FOR ${action.action}`);
      if (action.url) {
        openUrl();
        return;
      }
  }
}

function SearchResults({ actions, handleAction }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const total = actions.length;
  const list =
    Array.isArray(actions) &&
    actions.slice(0, 100).map(function (action, index) {
      return html`<${OmniItem}
        key=${action.action || action.url}
        index=${index}
        action=${action}
        isSelected=${index === selectedIndex}
        handleAction=${handleAction}
      />`;
    });

  useEffect(() => {
    if (
      actions.length > 0 &&
      (selectedIndex >= actions.length || isNaN(selectedIndex))
    ) {
      setSelectedIndex(actions.length - 1);
    }

    function handler(e) {
      const len = actions.length;
      switch (e.key) {
        case "ArrowUp":
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case "ArrowDown":
          setSelectedIndex((i) => Math.min(len > 0 ? len - 1 : 0, i + 1));
          break;
        case "Enter":
          const action = actions[selectedIndex];
          handleAction && handleAction(action, { metaKey: e.metaKey });
          break;
        case "Escape":
          handleAction && handleAction({ action: CloseOmniAction });
          break;
        // default:
        // console.warn(`unhandled ${e.key}`, e);
      }
    }
    window.addEventListener("keydown", handler);
    return () => {
      console.debug("unsub");
      window.removeEventListener("keydown", handler);
    };
  }, [selectedIndex, actions, handleAction]);

  return html`<div>
    <div id="omni-list">${list}</div>
    <div id="omni-footer">
      <div id="omni-results">
        ${list.length}${list.length < total ? "+" : ""} results
      </div>
      <div id="omni-arrows">
        Use arrow keys <span class="omni-shortcut">↑</span
        ><span class="omni-shortcut">↓</span> to navigate
      </div>
    </div>
  </div>`;
}

function HistorySearch({ searchTerm, handleAction }) {
  const [searched, setSearched] = useState([]);

  useEffect(() => {
    console.log("searching history");
    var tempvalue = searchTerm.replace("/history ", "");
    var query = "";
    if (tempvalue != "/history") {
      query = searchTerm.replace("/history ", "");
    }
    console.log("searching history", query);
    chrome.runtime.sendMessage(
      { request: "search-history", query: query },
      function (response) {
        console.log("got history: ", response.history);
        setSearched(response.history || []);
      }
    );
  }, [searchTerm]);

  if (!searched) {
    return null;
  }
  return SearchResults({ actions: searched, handleAction });
}

function BookmarksSearch({ searchTerm, allActions, handleAction }) {
  const [searchedActions, setSearchedActions] = useState([]);

  useEffect(() => {
    var tempvalue = searchTerm.replace("/bookmarks ", "");
    if (tempvalue != "/bookmarks" && tempvalue != "") {
      const query = searchTerm.replace("/bookmarks ", "");
      chrome.runtime.sendMessage(
        { request: "search-bookmarks", query },
        function (response) {
          console.log("got bookmarks", response);
          setSearchedActions(response.bookmarks);
        }
      );
    } else {
      setSearchedActions(allActions.filter((x) => x.type == "bookmark"));
    }
  }, [searchTerm, allActions]);

  return SearchResults({ actions: searchedActions, handleAction });
}

function RenderCommands({ handleAction }) {
  return SearchResults({
    actions: Commands,
    handleAction,
  });
}

function OmniList({ searchTerm, handleAction }) {
  const [allActions, setAllActions] = useState([]);
  const [filteredActions, setFiltered] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      chrome.runtime.sendMessage(
        { request: "get-actions" },
        function (response) {
          setAllActions(response.actions);
        }
      );
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    if (
      lowerTerm.startsWith("/history") ||
      lowerTerm.startsWith("/bookmarks")
    ) {
      return;
    }

    if (lowerTerm.startsWith("instagram ")) {
      const tempvalue = searchTerm.replace(/instagram\s*/, "").toLowerCase();
      const url = tempvalue.startsWith("#")
        ? `https://www.instagram.com/explore/tags/${tempvalue}/`
        : `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(
            tempvalue
          )}`;
      setFiltered([
        {
          title: `Search instagram for ${tempvalue}`,
          desc: `Search instagram for ${tempvalue}`,
          type: "action",
          url,
          favIconUrl:
            "https://www.instagram.com/static/images/ico/favicon.ico/36b3ee2d91ed.ico",
          action: "url",
          // emoji: true,
          // emojiChar: "🗄",
          keycheck: false,
        },
      ]);
      return;
    }

    const filters = [];

    if (lowerTerm.startsWith("/tabs")) {
      const tempvalue = searchTerm.replace(/\/tabs\s*/, "").toLowerCase();
      filters.push(
        (a) =>
          a.type === "tab" &&
          (a.title.toLowerCase().includes(tempvalue) ||
            a.url.toLowerCase().includes(tempvalue))
      );
    } else if (lowerTerm.startsWith("/actions")) {
      const tempvalue = lowerTerm.replace(/\/actions\s*/, "");
      filters.push(
        (a) => a.type === "action" && a.title.toLowerCase().includes(tempvalue)
      );
    } else {
      filters.push(
        (action) =>
          action.title.toLowerCase().includes(lowerTerm) ||
          action.url?.toLowerCase().includes(lowerTerm)
      );
    }

    setFiltered(
      allActions.filter((action) =>
        filters.reduce((val, filter) => val && filter(action), true)
      )
    );
  }, [allActions, searchTerm]);

  if (searchTerm.startsWith("/history")) {
    return HistorySearch({ searchTerm, handleAction });
  }
  if (searchTerm.startsWith("/bookmarks")) {
    return BookmarksSearch({ searchTerm, allActions, handleAction });
  }

  return SearchResults({ actions: filteredActions, handleAction });
}

const Shortcuts = {
  "/h": "/history ",
  "/t": "/tabs ",
  "/b": "/bookmarks ",
  "/a": "/actions ",
};

function MainApp(props) {
  const { showing, handleAction } = props;
  const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 250);
  const input = useRef(null);
  const onSearchChange = useCallback((e) => {
    const newValue = e.target.value;
    setSearch(Shortcuts[newValue] || newValue);
  });
  useEffect(() => {
    if (showing) {
      const timeout = setTimeout(
        () => input.current && input.current.focus(),
        100
      );
      return () => clearTimeout(timeout);
    }
  }, [showing]);
  const doHandle = useCallback(
    (action, ...args) => {
      debugger;
      if (action.shortcut) {
        setSearch(action.shortcut);
        return;
      }

      setSearch("");
      return;
      handleAction(action, ...args);
    },
    [handleAction]
  );

  if (!showing) {
    return null;
  }

  return html`<div id="omni-extension" class="omni-extension">
    <div id="omni-wrap">
      <div id="omni">
        <div id="omni-search">
          <input
            ref=${input}
            placeholder="Type a command or search"
            value=${search}
            onInput=${onSearchChange}
          />
        </div>
        <${OmniList}
          searchTerm=${debouncedSearchTerm}
          handleAction=${doHandle}
        />
      </div>
    </div>
    <div id="omni-overlay"></div>
  </div>`;
}

function App(props) {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    // Recieve messages from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.request == "open-omni") {
        setIsOpen((isOpen) => !isOpen);
      }
    });
  }, []);

  const actionHandler = useCallback((action, eventOptions) => {
    setIsOpen(false);

    console.log(`HANDLING ACTION!`, action);
    chrome.runtime.sendMessage(
      { request: action.action, tab: action },
      (response) => {
        if (response === false) {
          console.warn(`NOTHING DONE IN BG FOR ${action.action}`, action);
          handleAction(action, eventOptions);
        }
      }
    );
  });

  return html`<${MainApp} showing=${isOpen} handleAction=${actionHandler} />`;
}

// Append the omni into the current page
fetch(chrome.runtime.getURL("/content.html"))
  .then((res) => res.text())
  .then(async (data) => {
    render(html`<${App} />`, document.getElementById("omni-extension-wrapper"));
    return;

    document.body.innerHTML += data;

    var isOpen = false;
    var actions = [];
    var isFiltered = false;

    // Request actions from the background
    chrome.runtime.sendMessage({ request: "get-actions" }, function (response) {
      actions = response.actions;
      populateOmni();
    });

    function renderActions(actions) {
      const destEl = document.querySelector("#omni-extension #omni-list");
      destEl.innerHTML = actions
        .map(function (action, index) {
          var keys = "";
          if (action.keycheck) {
            keys = "<div class='omni-keys'>";
            action.keys.forEach(function (key) {
              keys += "<span class='omni-shortcut'>" + key + "</span>";
            });
            keys += "</div>";
          }
          const imgUrl =
            action.favIconUrl || chrome.runtime.getURL("/assets/globe.svg");
          var img =
            "<img src='" +
            imgUrl +
            "' alt='favicon' onerror='this.src=&quot;" +
            chrome.runtime.getURL("/assets/globe.svg") +
            "&quot;' class='omni-icon'>";
          if (action.emoji) {
            img =
              "<span class='omni-emoji-action'>" + action.emojiChar + "</span>";
          }

          return (
            `<div class='omni-item ${
              index === 0 ? "omni-item-active" : ""
            }' data-type='` +
            action.type +
            "' data-url='" +
            action.url +
            "'>" +
            img +
            "<div class='omni-item-details'><div class='omni-item-name'>" +
            action.title +
            "</div><div class='omni-item-desc'>" +
            action.url +
            "</div></div>" +
            keys +
            "<div class='omni-select'>Select <span class='omni-shortcut'>⏎</span></div></div>"
          );
        })
        .join("\n");
      $(".omni-extension #omni-results").html(actions.length + " results");
    }

    // Add actions to the omni
    function populateOmni() {
      renderActions(actions);
    }

    // Add filtered actions to the omni
    function populateOmniFilter(actions) {
      isFiltered = true;
      renderActions(actions);
    }

    // Open the omni
    function openOmni() {
      chrome.runtime.sendMessage(
        { request: "get-actions" },
        function (response) {
          isOpen = true;
          actions = response.actions;
          populateOmni();
          document.querySelector("#omni-extension input").value = "";
          $("html, body").stop();
          $("#omni-extension").removeClass("omni-closing");
          window.setTimeout(function () {
            $("#omni-extension input").focus();
          }, 100);
        }
      );
    }

    // Close the omni
    function closeOmni() {
      isOpen = false;
      $("#omni-extension").addClass("omni-closing");
    }

    // Hover over an action in the omni
    function hoverItem() {
      const el = document.querySelector(".omni-item-active");
      el.classList.remove("omni-item-active");
      $(this).addClass("omni-item-active");
    }

    // Autocomplete commands. Since they all start with different letters, it can be the default behavior
    function checkShortHand(e, value) {
      const el = document.querySelector(".omni-extension input");
      if (e.keyCode != 8) {
        if (value == "/t") {
          el.value = "/tabs ";
        } else if (value == "/b") {
          el.value = "/bookmarks ";
        } else if (value == "/h") {
          el.value = "/history ";
        } else if (value == "/r") {
          el.value = "/remove ";
        } else if (value == "/a") {
          el.value = "/actions ";
        }
      } else {
        if (
          value == "/tabs" ||
          value == "/bookmarks" ||
          value == "/actions" ||
          value == "/remove" ||
          value == "/history"
        ) {
          el.value = "";
        }
      }
      return el.value;
    }

    function debounce(fn, duration = 200) {
      let timeout = null;
      return function (...args) {
        const self = this;
        clearTimeout(timeout);
        timeout = setTimeout(fn.bind(self, ...args), duration);
      };
    }

    // Search for an action in the omni
    function search(e) {
      if (
        e.keyCode == 37 ||
        e.keyCode == 38 ||
        e.keyCode == 39 ||
        e.keyCode == 40 ||
        e.keyCode == 13 ||
        e.keyCode == 37
      ) {
        return;
      }
      var value = checkShortHand(e, this.value.toLowerCase()).toLowerCase();
      if (value.startsWith("/history")) {
        var tempvalue = value.replace("/history ", "");
        var query = "";
        if (tempvalue != "/history") {
          query = value.replace("/history ", "");
        }
        chrome.runtime.sendMessage(
          { request: "search-history", query: query },
          function (response) {
            populateOmniFilter(response.history);
          }
        );
      } else if (value.startsWith("/bookmarks")) {
        var tempvalue = value.replace("/bookmarks ", "");
        if (tempvalue != "/bookmarks" && tempvalue != "") {
          const query = value.replace("/bookmarks ", "");
          chrome.runtime.sendMessage(
            { request: "search-bookmarks", query },
            function (response) {
              populateOmniFilter(response.bookmarks);
            }
          );
        } else {
          populateOmniFilter(actions.filter((x) => x.type == "bookmark"));
        }
      } else {
        if (isFiltered) {
          populateOmni();
          isFiltered = false;
        }
        $("#omni-extension #omni-list .omni-item").filter(function () {
          if (value.startsWith("/tabs")) {
            var tempvalue = value.replace("/tabs ", "");
            if (tempvalue == "/tabs") {
              $(this).toggle($(this).attr("data-type") == "tab");
            } else {
              tempvalue = value.replace("/tabs ", "");
              $(this).toggle(
                ($(this)
                  .find(".omni-item-name")
                  .text()
                  .toLowerCase()
                  .indexOf(tempvalue) > -1 ||
                  $(this)
                    .find(".omni-item-desc")
                    .text()
                    .toLowerCase()
                    .indexOf(tempvalue) > -1) &&
                  $(this).attr("data-type") == "tab"
              );
            }
          } else if (value.startsWith("/remove")) {
            var tempvalue = value.replace("/remove ", "");
            if (tempvalue == "/remove") {
              $(this).toggle(
                $(this).attr("data-type") == "bookmark" ||
                  $(this).attr("data-type") == "tab"
              );
            } else {
              tempvalue = value.replace("/remove ", "");
              $(this).toggle(
                ($(this)
                  .find(".omni-item-name")
                  .text()
                  .toLowerCase()
                  .indexOf(tempvalue) > -1 ||
                  $(this)
                    .find(".omni-item-desc")
                    .text()
                    .toLowerCase()
                    .indexOf(tempvalue) > -1) &&
                  ($(this).attr("data-type") == "bookmark" ||
                    $(this).attr("data-type") == "tab")
              );
            }
          } else if (value.startsWith("/actions")) {
            var tempvalue = value.replace("/actions ", "");
            if (tempvalue == "/actions") {
              $(this).toggle($(this).attr("data-type") == "action");
            } else {
              tempvalue = value.replace("/actions ", "");
              $(this).toggle(
                ($(this)
                  .find(".omni-item-name")
                  .text()
                  .toLowerCase()
                  .indexOf(tempvalue) > -1 ||
                  $(this)
                    .find(".omni-item-desc")
                    .text()
                    .toLowerCase()
                    .indexOf(tempvalue) > -1) &&
                  $(this).attr("data-type") == "action"
              );
            }
          } else {
            $(this).toggle(
              $(this)
                .find(".omni-item-name")
                .text()
                .toLowerCase()
                .indexOf(value) > -1 ||
                $(this)
                  .find(".omni-item-desc")
                  .text()
                  .toLowerCase()
                  .indexOf(value) > -1
            );
          }
        });
      }
      $(".omni-extension #omni-results").html(
        $("#omni-extension #omni-list .omni-item:visible").length + " results"
      );
      $(".omni-item-active").removeClass("omni-item-active");
      $(".omni-extension #omni-list .omni-item:visible")
        .first()
        .addClass("omni-item-active");
    }

    // Handle actions from the omni
    function handleAction(e) {
      const action = actions.find(
        (x) =>
          x.title ==
          document.querySelector(".omni-item-active .omni-item-name")
            .textContent
      );
      closeOmni();
      const val = document
        .querySelector(".omni-extension input")
        .value.toLowerCase();
      if (val.startsWith("/remove")) {
        chrome.runtime.sendMessage({
          request: "remove",
          type: action.type,
          action: action,
        });
      } else if (val.toLowerCase().startsWith("/history")) {
        const url = document.querySelector(".omni-item-active").dataset.url;
        if (e.ctrlKey || e.metaKey) {
          window.open(url, "_self");
        } else {
          window.open(url);
        }
      } else {
        chrome.runtime.sendMessage({ request: action.action, tab: action });
        switch (action.action) {
          case "bookmark":
            if (e.ctrlKey || e.metaKey) {
              window.open(action.url);
            } else {
              window.open(action.url, "_self");
            }
            break;
          case "scroll-bottom":
            window.scrollTo(0, document.body.scrollHeight);
            break;
          case "scroll-top":
            window.scrollTo(0, 0);
            break;
          case "navigation":
            if (e.ctrlKey) {
              window.open(action.url);
            } else {
              window.open(action.url, "_self");
            }
            break;
          case "fullscreen":
            var elem = document.documentElement;
            elem.requestFullscreen();
            break;
          case "new-tab":
            window.open("");
            break;
          case "email":
            window.open("mailto:");
            break;
          case "url":
            if (e.ctrlKey || e.metaKey) {
              window.open(action.url);
            } else {
              window.open(action.url, "_self");
            }
            break;
        }
      }

      // Fetch actions again
      chrome.runtime.sendMessage(
        { request: "get-actions" },
        function (response) {
          actions = response.actions;
          populateOmni();
        }
      );
    }

    // Customize the shortcut to open the Omni box
    function openShortcuts() {
      chrome.runtime.sendMessage({ request: "extensions/shortcuts" });
    }

    // Check which keys are down
    var down = [];

    document.addEventListener("keydown", function (e) {
      down[e.keyCode] = true;
      down[e.key] = true;
      if (down[38]) {
        // Up key
        const activeEl = document.querySelector(".omni-item-active");
        if ($(activeEl).prevAll("div").not(":hidden").first().length) {
          var previous = $(activeEl).prevAll("div").not(":hidden").first();
          activeEl.classList.remove("omni-item-active");
          previous.addClass("omni-item-active");
          previous[0].scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else if (down[40]) {
        // Down key
        const activeEl = document.querySelector(".omni-item-active");
        if ($(activeEl).nextAll("div").not(":hidden").first().length) {
          var next = $(activeEl).nextAll("div").not(":hidden").first();
          activeEl.classList.remove("omni-item-active");
          next.addClass("omni-item-active");
          next[0].scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
    });
    document.addEventListener("keyup", function (e) {
      if (down[18] && down[16] && down[80]) {
        if (actions.find((x) => x.action == "pin") != undefined) {
          chrome.runtime.sendMessage({ request: "pin-tab" });
        } else {
          chrome.runtime.sendMessage({ request: "unpin-tab" });
        }
        chrome.runtime.sendMessage(
          { request: "get-actions" },
          function (response) {
            actions = response.actions;
            populateOmni();
          }
        );
      } else if (down[18] && down[16] && down[77]) {
        if (actions.find((x) => x.action == "mute") != undefined) {
          chrome.runtime.sendMessage({ request: "mute-tab" });
        } else {
          chrome.runtime.sendMessage({ request: "unmute-tab" });
        }
        chrome.runtime.sendMessage(
          { request: "get-actions" },
          function (response) {
            actions = response.actions;
            populateOmni();
          }
        );
      } else if (down[18] && down[16] && down[67]) {
        window.open("mailto:");
      }

      if (down[27] && isOpen) {
        // Esc key
        closeOmni();
      } else if (down[13] && isOpen) {
        // Enter key
        handleAction(e);
      }

      down = [];
    });

    // Recieve messages from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.request == "open-omni") {
        if (isOpen) {
          closeOmni();
        } else {
          openOmni();
        }
      }
    });

    // Events
    $(document).on("click", "#open-page-omni-extension-thing", openShortcuts);
    $(document).on(
      "mouseover",
      ".omni-extension .omni-item:not(.omni-item-active)",
      hoverItem
    );
    document
      .querySelector(".omni-extension input")
      .addEventListener("keyup", debounce(search));
    // $(document).on("keyup", ".omni-extension input", debounce(search));
    $(document).on("click", ".omni-item-active", handleAction);
    $(document).on("click", ".omni-extension #omni-overlay", closeOmni);
  });
