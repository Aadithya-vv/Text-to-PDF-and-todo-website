document.addEventListener("DOMContentLoaded", function () {
  const fontMap = {
    Font1: { css: "Times New Roman", pdf: "times" },
    Font2: { css: "Courier New", pdf: "courier" },
    Font3: { css: "Arial", pdf: "helvetica" }
  };

  // =================== PDF GENERATOR ===================
  if (document.getElementById("generatePdfBtn")) {
    const generateBtn = document.getElementById("generatePdfBtn");
    const fontSelect = document.getElementById("fontSelect");
    const fontSizeInput = document.getElementById("fontSize");
    const colorPicker = document.getElementById("colorPicker");
    const alignment = document.getElementById("alignment");
    const preview = document.getElementById("preview");
    const textInput = document.getElementById("textInput");

    fontSelect.addEventListener("change", updatePreview);
    textInput.addEventListener("input", updatePreview);
    updatePreview();

    generateBtn.addEventListener("click", () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const text = textInput.value;
      const fontKey = fontSelect.value;
      const fontSize = parseInt(fontSizeInput.value, 10) || 16;
      const color = hexToRgb(colorPicker.value);
      const align = alignment.value;

      const { pdf: jsPdfFont } = fontMap[fontKey] || fontMap.Font3;

      doc.setFont(jsPdfFont);
      doc.setFontSize(fontSize);
      if (color) doc.setTextColor(color.r, color.g, color.b);

      const lines = doc.splitTextToSize(text, 180);
      const y = 20;

      lines.forEach((line, index) => {
        let x;
        if (align === "center") x = 105;
        else if (align === "right") x = 200;
        else x = 10;

        doc.text(line, x, y + index * (fontSize + 2), { align });
      });

      doc.save("generated.pdf");
    });

    function updatePreview() {
      const selectedFont = fontSelect.value;
      const sample = textInput.value || "Font Preview";
      preview.style.fontFamily = fontMap[selectedFont]?.css || "Arial";
      preview.textContent = sample;
    }
  }

  // =================== TO-DO LIST ===================
  const friends = [
    { name: "Alice", emoji: "🐱" },
    { name: "Bob", emoji: "🐶" },
    { name: "Cara", emoji: "🐼" },
    { name: "Dan", emoji: "🦊" },
    { name: "Eva", emoji: "🐰" },
    { name: "Finn", emoji: "🐸" },
    { name: "Gina", emoji: "🐥" },
    { name: "Hank", emoji: "🐯" },
    { name: "Ivy", emoji: "🦁" },
    { name: "Jay", emoji: "🐨" },
    { name: "Kay", emoji: "🐷" },
    { name: "Leo", emoji: "🐻" }
  ];

  const taskInput = document.getElementById("taskInput");
  const deadlineInput = document.getElementById("deadlineInput");
  const addTaskButton = document.getElementById("addTask");
  const taskList = document.getElementById("taskList");
  const friendSelect = document.getElementById("friendSelect");

  // Populate friend dropdown
  friends.forEach(friend => {
    const opt = document.createElement("option");
    opt.value = friend.name;
    opt.textContent = `${friend.emoji} ${friend.name}`;
    friendSelect.appendChild(opt);
  });

  const getCurrentUser = () => friendSelect.value;

  addTaskButton.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;
    if (text) {
      const newTask = {
        text,
        deadline,
        pending: friends.map(f => f.name)
      };
      const taskKey = db.ref().child("sharedTasks").push().key;
      db.ref("sharedTasks/" + taskKey).set(newTask);
      taskInput.value = "";
      deadlineInput.value = "";
    }
  });

  function addTaskToDOM(taskId, taskData) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = taskId;

    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = taskData.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.className = "delete-task";
    deleteBtn.title = "Delete task";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this task?")) {
        db.ref("sharedTasks/" + taskId).remove();
      }
    });

    taskHeader.appendChild(textSpan);
    taskHeader.appendChild(deleteBtn);
    li.appendChild(taskHeader);

    // Deadline display
    if (taskData.deadline) {
      const deadlinePara = document.createElement("p");
      deadlinePara.className = "task-deadline";
      deadlinePara.textContent = `⏰ Deadline: ${taskData.deadline}`;
      li.appendChild(deadlinePara);
    }

    const emojiWrapper = document.createElement("div");
    emojiWrapper.className = "emoji";

    taskData.pending.forEach(friendName => {
      const friend = friends.find(f => f.name === friendName);
      if (!friend) return;

      const emojiSpan = document.createElement("span");
      emojiSpan.textContent = friend.emoji;
      emojiSpan.dataset.friend = friend.name;
      emojiSpan.title = friend.name;

      emojiSpan.addEventListener("click", () => {
        if (getCurrentUser() !== friend.name) {
          alert(`Only ${friend.name} can remove their emoji!`);
          return;
        }
        const updatedPending = taskData.pending.filter(name => name !== friend.name);
        db.ref("sharedTasks/" + taskId + "/pending").set(updatedPending);
      });

      emojiWrapper.appendChild(emojiSpan);
    });

    li.appendChild(emojiWrapper);
    taskList.appendChild(li);
  }

  function renderTasks(snapshot) {
    taskList.innerHTML = "";
    const tasks = snapshot.val();
    for (const taskId in tasks) {
      addTaskToDOM(taskId, tasks[taskId]);
    }
  }

  db.ref("sharedTasks").on("value", renderTasks);
});
