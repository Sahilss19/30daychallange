🎙 Day 24 – Adding Persona to the AI Voice Agent

Today was all about making the AI Voice Agent more fun & engaging by giving it a persona 🚀

🔹 What I Did

Added a persona system to the agent (Pirate, Cowboy, Robot, Teacher, and even Myself 😅).

Updated the UI with a dropdown so the user can select the persona before starting a conversation.

Sent the selected persona to the backend via WebSocket.

The LLM now responds in-character, making conversations lively and entertaining.

🔹 Why It’s Important

Until now, the agent could transcribe → understand → reply → speak.
But with personas, the agent isn’t just an assistant – it becomes a character 🎭
This makes the bot more interactive, fun, and useful in different contexts (education, roleplay, customer support, etc.).

🔹 Demo

🎥 Video of my working agent with different personas:

🤠 Cowboy → “Howdy partner!”

☠️ Pirate → “Ahoy matey, ready to sail?”

🤖 Robot → “Beep boop, initiating response.”

👩‍🏫 Teacher → “Let’s break this down step by step.”

🙋‍♂️ Me → My own style 😉

🔹 Code Snapshot (Frontend Persona Selection)
// Send persona choice to server
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "persona", value: personaSelect.value }));
};

// Update label dynamically
personaSelect.addEventListener("change", () => {
  const persona = personaSelect.value;
  let label = "";
  if (persona === "cowboy") label = "Your Cowboy AI Assistant ";
  if (persona === "pirate") label = "Your Pirate AI Assistant";
  if (persona === "robot") label = "Your Robot AI Assistant ";
  if (persona === "teacher") label = "Your Teacher AI Assistant ";
  if (persona === "me") label = " @SahilKulria27 ";
  personaLabel.textContent = label;
});

🔹 Output

Now, when chatting, the agent’s tone changes based on persona.
Example:

User: “Tell me a joke”

Cowboy AI 🤠: “Well partner, why did the horse cross the road? To giddy-up to the other side!”

Pirate AI ☠️: “Har har! A pirate walks into a bar… with a steering wheel stuck to his pants!”

👉 Next up (Day 25): Saving chat history so the agent can remember conversations 💾