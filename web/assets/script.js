const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

const BOT_NAME = "BOT";
const PERSON_NAME = "Garmur";

msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msgText = msgerInput.value;
  if (!msgText) return;

  appendMessage(PERSON_NAME, "right", msgText);
  msgerInput.value = "";

  botResponse();
});

function appendMessage(alias, side, text) {
	const message = document.createElement("div")
	message.setAttribute("class", `msg ${side}-msg`)

	const bubble = document.createElement("div")
	bubble.setAttribute("class", "msg-bubble")
	message.appendChild(bubble)

	const info = document.createElement("div")
	info.setAttribute("class", "msg-info")
	bubble.appendChild(info)

	const name = document.createElement("div")
	name.setAttribute("class", "msg-info-name")
	name.textContent = alias
	info.appendChild(name)

	const time = document.createElement("div")
	time.setAttribute("class", "msg-info-time")
	time.textContent = formatDate(new Date())
	info.appendChild(time)

	const content = document.createElement("div")
	content.setAttribute("class", "msg-text")
	content.textContent = text
	bubble.appendChild(content)

	if (side == "right") {
		const indicator = document.createElement("div")
		indicator.setAttribute("class", "msg-indicator")
		indicator.textContent = "⌛"
		bubble.appendChild(indicator)
	}

	msgerChat.appendChild(message)
	msgerChat.scrollTop += 500;
}

function botResponse() {
  const msgText = "Static text for testing answers"
  const delay = msgText.split(" ").length * 100;

  setTimeout(() => {
	appendMessage(BOT_NAME, "left", msgText);
  }, delay);
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}
