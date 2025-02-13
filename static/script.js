// Configure Monaco Editor
require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs",
  },
});
let editor = "";
let clips = [];
const messagesDiv = document.getElementById("messages");
const editorDiv = document.getElementById("editor");
const mainEditorDiv = document.getElementById("mainEditorDiv");
const initialEditorHeight = 17;
const minimizedEditorHeight = 5;
const defaultMessagesHeight = 70;
const expandedMessagesHeight = 80;
let isEditorMinimized = false;
const buttons = document.querySelectorAll("button");
// Add a tooltip system
const tooltips = {
  sendButton: "Share your code (Ctrl/Cmd + Enter)",
  clearCode: "Clear editor (Ctrl/Cmd + L)",
  clearAll: "Clear all messages (Ctrl/Cmd + Shift + L)",
  formatCode: "Format code",
  copyLink: "Copy share link",
  themeToggle: "Toggle theme",
};

function getDeviceDetails() {
  var unknown = "-";

  // screen
  var screenSize = "";
  if (screen.width) {
    var width = screen.width ? screen.width : "";
    var height = screen.height ? screen.height : "";
    screenSize += "" + width + " x " + height;
  }

  // browser
  var nVer = navigator.appVersion;
  var nAgt = navigator.userAgent;
  var browser = navigator.appName;
  var version = "" + parseFloat(nVer);
  var nameOffset, verOffset, ix;

  // Yandex Browser
  if ((verOffset = nAgt.indexOf("YaBrowser")) != -1) {
    browser = "Yandex";
    version = nAgt.substring(verOffset + 10);
  }
  // Samsung Browser
  else if ((verOffset = nAgt.indexOf("SamsungBrowser")) != -1) {
    browser = "Samsung";
    version = nAgt.substring(verOffset + 15);
  }
  // UC Browser
  else if ((verOffset = nAgt.indexOf("UCBrowser")) != -1) {
    browser = "UC Browser";
    version = nAgt.substring(verOffset + 10);
  }
  // Opera Next
  else if ((verOffset = nAgt.indexOf("OPR")) != -1) {
    browser = "Opera";
    version = nAgt.substring(verOffset + 4);
  }
  // Opera
  else if ((verOffset = nAgt.indexOf("Opera")) != -1) {
    browser = "Opera";
    version = nAgt.substring(verOffset + 6);
    if ((verOffset = nAgt.indexOf("Version")) != -1) {
      version = nAgt.substring(verOffset + 8);
    }
  }
  // Legacy Edge
  else if ((verOffset = nAgt.indexOf("Edge")) != -1) {
    browser = "Microsoft Legacy Edge";
    version = nAgt.substring(verOffset + 5);
  }
  // Edge (Chromium)
  else if ((verOffset = nAgt.indexOf("Edg")) != -1) {
    browser = "Microsoft Edge";
    version = nAgt.substring(verOffset + 4);
  }
  // MSIE
  else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
    browser = "Microsoft Internet Explorer";
    version = nAgt.substring(verOffset + 5);
  }
  // Chrome
  else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
    browser = "Chrome";
    version = nAgt.substring(verOffset + 7);
  }
  // Safari
  else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
    browser = "Safari";
    version = nAgt.substring(verOffset + 7);
    if ((verOffset = nAgt.indexOf("Version")) != -1) {
      version = nAgt.substring(verOffset + 8);
    }
  }
  // Firefox
  else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
    browser = "Firefox";
    version = nAgt.substring(verOffset + 8);
  }
  // MSIE 11+
  else if (nAgt.indexOf("Trident/") != -1) {
    browser = "Microsoft Internet Explorer";
    version = nAgt.substring(nAgt.indexOf("rv:") + 3);
  }
  // Other browsers
  else if (
    (nameOffset = nAgt.lastIndexOf(" ") + 1) <
    (verOffset = nAgt.lastIndexOf("/"))
  ) {
    browser = nAgt.substring(nameOffset, verOffset);
    version = nAgt.substring(verOffset + 1);
    if (browser.toLowerCase() == browser.toUpperCase()) {
      browser = navigator.appName;
    }
  }

  // trim the version string
  if ((ix = version.indexOf(";")) != -1) version = version.substring(0, ix);
  if ((ix = version.indexOf(" ")) != -1) version = version.substring(0, ix);
  if ((ix = version.indexOf(")")) != -1) version = version.substring(0, ix);

  var majorVersion = parseInt("" + version, 10);
  if (isNaN(majorVersion)) {
    version = "" + parseFloat(nVer);
    majorVersion = parseInt(nVer, 10);
  }

  // mobile version
  var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

  // system
  var os = unknown;
  var clientStrings = [
    { s: "Windows 10", r: /(Windows 10.0|Windows NT 10.0)/ },
    { s: "Windows 8.1", r: /(Windows 8.1|Windows NT 6.3)/ },
    { s: "Windows 8", r: /(Windows 8|Windows NT 6.2)/ },
    { s: "Windows 7", r: /(Windows 7|Windows NT 6.1)/ },
    { s: "Windows Vista", r: /Windows NT 6.0/ },
    { s: "Windows Server 2003", r: /Windows NT 5.2/ },
    { s: "Windows XP", r: /(Windows NT 5.1|Windows XP)/ },
    { s: "Windows 2000", r: /(Windows NT 5.0|Windows 2000)/ },
    { s: "Windows ME", r: /(Win 9x 4.90|Windows ME)/ },
    { s: "Windows 98", r: /(Windows 98|Win98)/ },
    { s: "Windows 95", r: /(Windows 95|Win95|Windows_95)/ },
    { s: "Windows NT 4.0", r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
    { s: "Windows CE", r: /Windows CE/ },
    { s: "Windows 3.11", r: /Win16/ },
    { s: "Android", r: /Android/ },
    { s: "Open BSD", r: /OpenBSD/ },
    { s: "Sun OS", r: /SunOS/ },
    { s: "Chrome OS", r: /CrOS/ },
    { s: "Linux", r: /(Linux|X11(?!.*CrOS))/ },
    { s: "iOS", r: /(iPhone|iPad|iPod)/ },
    { s: "Mac OS X", r: /Mac OS X/ },
    { s: "Mac OS", r: /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
    { s: "QNX", r: /QNX/ },
    { s: "UNIX", r: /UNIX/ },
    { s: "BeOS", r: /BeOS/ },
    { s: "OS/2", r: /OS\/2/ },
    {
      s: "Search Bot",
      r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
    },
  ];
  for (var id in clientStrings) {
    var cs = clientStrings[id];
    if (cs.r.test(nAgt)) {
      os = cs.s;
      break;
    }
  }

  return {
    screen: screenSize,
    browser: browser,
    browserVersion: version,
    browserMajorVersion: majorVersion,
    mobile: mobile,
    os: os,
  };
}

// validate main user/admin
async function validateUser() {
  try {
    const response = await fetch("/validate_user");
    if (response.ok) {
      // User is allowed, display the Flush button
      document.getElementById("clearAll").classList.remove("hidden");
    }
  } catch (error) {
    console.error("Not authorized to flush database:", error);
  }
}
// get all clips
async function fetchClip() {
  const response = await fetch("/clips");
  if (!response.ok) {
    throw new Error("Failed to fetch clips");
  }
  clips = await response.json();
  if (clips) {
    const messagesContainer = document.getElementById("messages");
    messagesContainer.innerHTML = "";
  }
  const myUsername = getUsername();
  let icon = ""
  clips.forEach((clip, index) => {
    const isMine = clip.name === myUsername;
    const browser = clip.device_type.toLowerCase();

    switch (true) {
      case browser.includes("windows"):
        icon = "./window_icon.svg";
        break;
      case browser.includes("mac") :
        icon = "./mac_icon.png";
        break;
      case  browser.includes("ios"):
      icon = "./apple_icon.svg";
      break;
      case browser.includes("android"):
        icon = "./android_icon.svg";
        break;
      case browser.includes("linux"):
        icon = "./linux_icon.svg";
        break;
      default:
        icon = "./default_icon.png";
    }

    createMessage(
      clip.name,
      clip.id,
      clip.text,
      clip.language,
      isMine,
      clip.id,
      index,
      icon
    );
  });
}
// send api call
async function handleSendMessage() {
  require(["vs/editor/editor.main"], async function () {
    const code = editor.getValue();

    if (!code.trim()) {
      showToast("Please enter some code first!");
      return;
    }

    const language = document.getElementById("languageSelect").value;
    const username = getUsername();
    const datetime = new Date().toISOString();

    // Get browser and device type
    const deviceDetails = getDeviceDetails();

    const clip = {
      id: datetime,
      text: code,
      language,
      name: username,
      device_type: deviceDetails.os,
      browser: deviceDetails.browser,
    };

    try {
      const response = await fetch("/add_clip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clip),
      });

      if (!response.ok) {
        throw new Error("Failed to submit clip");
      }
      fetchClip();
      //   createMessage(username, datetime, code, language, true);

      showToast("Code shared successfully!");
    } catch (error) {
      console.error("Error submitting clip:", error);
    }
    editor.setValue("");
  });
}
// Flush the database (delete all clips)
async function flushDatabase() {
  try {
    const response = await fetch("/flush", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // Clear the displayed clips
    // alert("Database flushed successfully!");
    fetchClip();
  } catch (error) {
    console.error("Error flushing database:", error);
    // alert(error);
    showToast(error);
  }
}
// Generate or retrieve username from local storage
function getUsername() {
  let username = localStorage.getItem("username");
  if (!username) {
    username = generateUsername();
    localStorage.setItem("username", username);
  }
  return username;
}
// language dropdown
function populateLanguageDropdown() {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    const languageSelect = document.getElementById("languageSelect");
    const languages = monaco.languages.getLanguages();

    languages.forEach((lang) => {
      if (lang.id) {
        const option = document.createElement("option");
        option.value = lang.id;
        option.textContent = lang.aliases ? lang.aliases[0] : lang.id;
        languageSelect.appendChild(option);
      }
    });
    initializeEditor('"plaintext"');
  });
}
// initialize editor
function initializeEditor(language) {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    if (editor) {
      editor.dispose();
    }
    editor = monaco.editor.create(document.getElementById("editor"), {
      value: `// Write here`,
      language: language,
      minimap: {
        enabled: false,
      },

      value: "",
      theme: "vs",
      automaticLayout: true,
      fontSize: 12,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      roundedSelection: true,
      padding: {
        top: 10,
        bottom: 10,
      },
      fontFamily: '"Fira Code", monospace',
      // indentSize:0,
      // glyphMargin:false,
      folding: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: false,
      renderLineHighlight: "none",
      //   EditorAutoIndentStrategy:"none",
      //   WrappingIndent:"none",
      //   ITextModelUpdateOptions: {
      //     indentSize:0,
      //     insertSpaces: false,
      //     tabSize: 0,
      //     trimAutoWhitespace: true,
      // }
    });
  });
}
// Show toast message
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  toast.className = `fixed bottom-4 right-4 transform transition-all duration-300`;
  toastMessage.textContent = message;
  toast.style.transform = "translateY(0)";
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.transform = "translateY(100%)";
    toast.style.opacity = "0";
  }, 3000);
}
// Generate random usernames for others
function generateUsername() {
  const adjectives = [
    "Happy",
    "Lucky",
    "Clever",
    "Swift",
    "Bright",
    "Cool",
    "Epic",
    "Pro",
  ];
  const nouns = [
    "Coder",
    "Dev",
    "Ninja",
    "Guru",
    "Wizard",
    "Hero",
    "Master",
    "Expert",
  ];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// generate message div
function createMessage(username, datetime, code, language, isMine, id, index, icon) {
  require(["vs/editor/editor.main"], function () {
    // const messageId = `editor-${new Date().getTime()}`;
    const formattedDate = new Date(datetime).toLocaleDateString("en-US", {
      // weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const alignmentClass = isMine ? "justify-end bg-red" : "justify-start";
    const colorFamily = isMine ? " bg-blue-50" : " bg-gray-100";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = code?.match(urlRegex);
    const firstUrl = urls
      ? urls?.includes("youtube")
        ? convertToYouTubeEmbedUrl(urls[0])
        : urls[0]
      : null;
    let isYoutube = urls && urls[0]?.includes("youtube") ? true : false;
    const messageHTML = `
  <div class="w-full items-start flex ${alignmentClass} my-1 mb-3">
            <div class=" ${colorFamily} glass-effect rounded-2xl p-2 w-[90%] sm:w-[90%] md:w-[80%] lg:w-[50%] xl:w-[45%] 2xl:w-[45%]  border border-gray-200 hover:neon-border transition-all duration-300">
                <div class="flex flex-row md:flex-row gap-2 justify-between items-center md:items-center md:gap-4 mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-md font-bold">${username}</span>
                    </div>
                    <div class="flex  items-center justify-between w-[100%]">
                        <span class="text-gray-400 text-xs">${formattedDate}</span>
                        <div class="flex gap-2 items-center justify-center">


                         <span class="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-900 text-xxs">${language}</span>
                          <div class="p-0.5 rounded-lg text-xs  hover-neon text-indigo-900 flex items-center justify-center transition-all duration-300 ">
                          <img src=${icon} class="w-5 h-5 m-1"/>
                         </div>

                        <button
                          class="p-2 copy-btn rounded-lg text-xs  hover-neon transition-all duration-300 bg-gray-200"
                          id="copyLink"
                          data-code="${index}"
                        >
                          <i class="fas fa-copy"></i>
                        </button>
                </div>

            </div>
            </div>
          <div id="${id}" class="code-editor-container" style="overflow: auto; border-radius: 10px; max-height: 20vh; width:100%"></div>
        ${
          language === "plaintext" && firstUrl && isYoutube
            ? `<iframe src="${firstUrl}" class="w-full mt-2 border rounded-lg shadow-md" style="height: 20vh;"></iframe>`
            : ""
        }
            </div>
            </div>
        `;

    const messagesContainer = document.getElementById("messages");
    if (messagesContainer.querySelector(".text-center")) {
      messagesContainer.innerHTML = "";
    }
    messagesContainer.insertAdjacentHTML("beforeend", messageHTML);
    const container = document.getElementById(id);
    const editorInstance = monaco.editor.create(container, {
      value: code,
      language: language || "plaintext",
      readOnly: true,
      minimap: {
        enabled: false,
      },
      theme: "vs",
      fontSize: 12,
      automaticLayout: true,
      lineNumbers: "on",
      roundedSelection: true,
      padding: {
        top: 10,
        bottom: 10,
      },
      fontFamily: '"Fira Code", monospace',
      folding: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: false,
      renderLineHighlight: "none",
    });

    const contentHeight = editorInstance.getContentHeight();
    const maxHeight = window.innerHeight * 0.2;
    if (contentHeight < maxHeight) {
      container.style.height = `${contentHeight}px`;
    } else {
      container.style.height = `${maxHeight}px`;
      container.style.overflow = "auto";
    }

    editorInstance.layout(); // Update layout
    // editorInstance.onDidContentSizeChange(updateEditorHeight);
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 200);

    // Copy button functionality
    messagesContainer.lastElementChild
      .querySelector(".copy-btn")
      .addEventListener("click", function () {
        const datacode = this.getAttribute("data-code");
        const codeToCopy = clips?.[datacode]?.text;
        const tempInput = document.createElement("textarea");
        document.body.appendChild(tempInput);
        tempInput.value = codeToCopy;
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showToast("Code copied to clipboard!");
      });
  });
}
// for preview convert youtube url to embedded
function convertToYouTubeEmbedUrl(url) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url?.match(regex);
  if (match[1]) {
    console.log("aswedrftgyhuj", `https://www.youtube.com/embed/${match[1]}`);
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}
// Function to reset the editor height to its default size
function resetEditorHeight() {
  if (isEditorMinimized) {
    editorDiv.style.height = `${initialEditorHeight}vh`;
    isEditorMinimized = false; // Reset the state
  }
}
// Function to reset the messages height to its default size
function resetMessagesHeight() {
  messagesDiv.style.height = `${defaultMessagesHeight}vh`;
}
// share code  handler
document
  .getElementById("sendButton")
  .addEventListener("click", handleSendMessage);
// formate data in editor
document.getElementById("formatCode").addEventListener("click", () => {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    editor.getAction("editor.action.formatDocument").run();
    showToast("Code formatted successfully!");
  });
});
// clear code from editor
document.getElementById("clearCode").addEventListener("click", () => {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    editor.setValue("");
    // updateEditorStats();
    showToast("Editor cleared!");
  });
});
// flush handler
document.getElementById("clearAll").addEventListener("click", () => {
  const flushModel = document.getElementById("flushModel");
  const flushModelYes = document.getElementById("flushAllClips");
  const flushModelNo = document.getElementById("notFlushAllClips");
  flushModel.classList.remove("hidden");
  flushModelNo?.addEventListener("click", () => {
    flushModel.classList.add("hidden");
  });

  flushModelYes?.addEventListener("click", () => {
    flushDatabase();

    require.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
      },
    });
    require(["vs/editor/editor.main"], function () {
      document.getElementById("messages").innerHTML = `
                  <div class=" rounded-2xl p-8 text-center ">
           <div
             class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4"
           >
             <i class="fas fa-code text-blue-600 text-2xl"></i>
           </div>
           <h3 class="text-2xl font-bold text-gray-900 mb-2">
             Welcome to Clipify!
           </h3>
           <p class="text-gray-600 max-w-lg mx-auto">
              Share your text with people around the world. Start by
             typing your text in the editor below.
           </p>
         </div>
              `;
      editor.setValue("");
      // updateEditorStats();
      flushModel.classList.add("hidden");
      showToast("Clipify cleared!");
    });
  });
});
// refresh handler
document.getElementById("refresh")?.addEventListener("click", () => {
  location.reload();
});

// paste
document.getElementById("paste")?.addEventListener("click", async() => {
  try {
    const text = await navigator?.clipboard?.readText();
      if (editor) {
          const position = editor.getPosition();
          editor.executeEdits("", [{
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              text: text,
              forceMoveMarkers: true
          }]);
      }
  } catch (err) {
      console.error("Failed to read clipboard: ", err);
  }
});
// Language selection handler with animation
document.getElementById("languageSelect").addEventListener("change", (e) => {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    const select = e.target;
    select.style.transform = "scale(0.95)";
    setTimeout(() => {
      select.style.transform = "scale(1)";
    }, 100);
    monaco.editor.setModelLanguage(editor.getModel(), e.target.value);
  });
});
// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to send
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    handleSendMessage();
  }
  // Ctrl/Cmd + L to clear editor
  if ((e.ctrlKey || e.metaKey) && e.key === "l") {
    e.preventDefault();
    document.getElementById("clearCode").click();
  }
  // Ctrl/Cmd + Shift + L to clear all
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
    e.preventDefault();
    document.getElementById("clearAll").click();
  }
});
// Add visual feedback for buttons
buttons.forEach((button) => {
  button.addEventListener("mousedown", () => {
    button.style.transform = "scale(0.95)";
  });
  button.addEventListener("mouseup", () => {
    button.style.transform = "scale(1)";
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
  });
});

Object.entries(tooltips).forEach(([id, text]) => {
  const element = document.getElementById(id);
  if (element) {
    element.setAttribute("title", text);
  }
});
// Scroll event listener to handle editor and messages height change on scroll
messagesDiv.addEventListener("scroll", () => {
  let code = editor.getValue();
  if (messagesDiv.scrollTop > 0 && !isEditorMinimized && code.length === 0) {
    // If the user has started scrolling down, minimize the editor to 2vh
    editorDiv.style.height = `${minimizedEditorHeight}vh`;
    messagesDiv.style.height = `${expandedMessagesHeight}vh`; // Expand messages height to 80vh
    isEditorMinimized = true; // Track that the editor is minimized
  }
  // else if (messagesDiv.scrollTop === 0 && isEditorMinimized) {
  //   // If scrolled to the top, reset the editor height to its default size
  //   resetEditorHeight();
  //   resetMessagesHeight(); // Reset the messages height to 70vh
  // }
});
// Click event listener on the editor to reset its height to the default size
mainEditorDiv.addEventListener("click", () => {
  resetEditorHeight();
  resetMessagesHeight(); // Reset the messages height to 70vh
});

editorDiv.addEventListener("input", () => {
  if (editor.getValue().length === 0) {
    editorDiv.style.height = `${minimizedEditorHeight}vh`;
    messagesDiv.style.height = `${expandedMessagesHeight}vh`;
    isEditorMinimized = true;
  } else {
    resetEditorHeight();
    resetMessagesHeight();
  }
});

setInterval(() => {
  fetchClip();
}, 20000);

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");

  try {
    populateLanguageDropdown();
    validateUser();
  } catch (error) {
    console.error("Error in populateLanguageDropdown:", error);
  }

  try {
    fetchClip();
  } catch (error) {
    console.error("Error in fetchClip:", error);
  }
});
