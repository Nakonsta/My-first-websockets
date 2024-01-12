const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
const client = new WebSocket(`${wsProto}//${location.host}`);

const name = faker.internet.userName();
const messagesContainer = document.getElementById("chat");

const addMessage = ({ name, message }) => {
  const cEl = document.createElement("p");
  const nEl = document.createElement("span");
  nEl.className = "name";
  nEl.innerText = name;
  cEl.appendChild(nEl);

  const mEl = document.createElement("span");
  mEl.className = "message";
  mEl.innerText = message;
  cEl.appendChild(mEl);

  messagesContainer.appendChild(cEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

client.addEventListener("message", (message) => {
  let data;
  // message.data - это Blob, поэтому его приходится расшифровывать через Blob.text, но вообще это странно
  try {
    data = message.data.text().then((txt) => {
      if (JSON.parse(txt)?.type === "chat_message") {
        // console.log(`${chalk.bold.green(data.name)}: ${chalk.blue(data.message)}`);
        addMessage(JSON.parse(txt));
      }
    });
  } catch (err) {
    return;
  }
});

const postMessage = () => {
  const message = faker.lorem.sentence();

  client.send(
    JSON.stringify({
      type: "chat_message",
      name,
      message,
    })
  );

  setTimeout(postMessage, 2000 + (Math.random() - 0.5) * 200);
};

client.addEventListener("open", postMessage);
