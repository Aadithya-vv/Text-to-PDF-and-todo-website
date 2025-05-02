document.addEventListener("DOMContentLoaded", function () {
  // =================== PDF CONVERTER CODE ===================
  if (document.getElementById('textInput') && document.getElementById('generatePdfBtn')) {
    const fontMap = {
      Font1: { css: "Times New Roman", pdf: "times" },
      Font2: { css: "Courier New", pdf: "courier" },
      Font3: { css: "Arial", pdf: "helvetica" }
    };

    const generateBtn = document.getElementById("generatePdfBtn");
    const fontSelect = document.getElementById("fontSelect");
    const fontSizeInput = document.getElementById("fontSize");
    const colorPicker = document.getElementById("colorPicker");
    const alignment = document.getElementById("alignment");
    const preview = document.getElementById("preview");
    const textInput = document.getElementById("textInput");
    const pdfUpload = document.getElementById("pdfUpload");

    let originalPdfStructure = null;

    if (fontSelect && textInput) {
      fontSelect.addEventListener("change", updatePreview);
      textInput.addEventListener("input", updatePreview);
      updatePreview();
    }

    if (pdfUpload) {
      pdfUpload.addEventListener("change", async function () {
        const file = pdfUpload.files[0];
        if (!file || file.type !== "application/pdf") return;

        const reader = new FileReader();
        reader.onload = async function () {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          
          originalPdfStructure = {
            numPages: pdf.numPages,
            pages: []
          };

          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            const textContent = await page.getTextContent();
            
            const pageStructure = {
              width: viewport.width,
              height: viewport.height,
              items: []
            };

            textContent.items.forEach(item => {
              pageStructure.items.push({
                str: item.str,
                transform: item.transform,
                width: item.width,
                height: item.height
              });
            });

            originalPdfStructure.pages.push(pageStructure);
            
            const lines = textContent.items.map(item => item.str.trim()).filter(Boolean);
            const pageText = lines.join("\n");
            fullText += pageText;
            if (i < pdf.numPages) fullText += "\f";
          }

          textInput.value = fullText;
          updatePreview();
        };

        reader.readAsArrayBuffer(file);
      });
    }

    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        if (!originalPdfStructure) {
          alert("Please upload a PDF first to use its structure");
          return;
        }

        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF({
          orientation: originalPdfStructure.pages[0].width > originalPdfStructure.pages[0].height ? "landscape" : "portrait",
          unit: "pt",
          format: [originalPdfStructure.pages[0].width, originalPdfStructure.pages[0].height]
        });

        const text = textInput.value;
        const fontKey = fontSelect.value;
        const fontSize = parseInt(fontSizeInput.value, 10) || 16;
        const color = hexToRgb(colorPicker.value);
        const align = alignment.value;
        const { pdf: jsPdfFont } = fontMap[fontKey] || fontMap.Font3;

        doc.setFont(jsPdfFont);
        doc.setFontSize(fontSize);
        if (color) doc.setTextColor(color.r, color.g, color.b);

        const pages = text.split("\f");
        
        for (let i = 0; i < originalPdfStructure.numPages; i++) {
          if (i > 0) {
            doc.addPage([originalPdfStructure.pages[i].width, originalPdfStructure.pages[i].height]);
          }
          
          const pageText = pages[i] || "";
          const originalPage = originalPdfStructure.pages[i];
          
          const lines = doc.splitTextToSize(pageText, originalPage.width - 40);
          
          let y = 40;
          lines.forEach(line => {
            let x;
            if (align === "center") x = originalPage.width / 2;
            else if (align === "right") x = originalPage.width - 20;
            else x = 20;

            doc.text(line, x, y, { align });
            y += fontSize * 1.5;
            
            if (y > originalPage.height - 20) {
              doc.addPage([originalPage.width, originalPage.height]);
              y = 40;
            }
          });
        }

        doc.save("generated.pdf");
      });
    }

    function updatePreview() {
      const selectedFont = fontSelect.value;
      const sample = textInput.value || "Font Preview";
      preview.style.fontFamily = fontMap[selectedFont]?.css || "Arial";
      preview.textContent = sample;
    }

    function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      };
    }
  }

  // =================== TO-DO LIST CODE ===================
  if (document.getElementById('taskInput') && document.getElementById('taskList')) {
    const friends = [
      { name: "Aadithya", emoji: "🐱" },
      { name: "Kishor", emoji: "🐶" },
      { name: "Arun", emoji: "🐼" },
      { name: "Dharakeshwar", emoji: "🦊" },
      { name: "Karthik", emoji: "🐰" },
      { name: "Baradhwaj", emoji: "🐸" },
      { name: "Ammu", emoji: "🐥" },
      { name: "Achu", emoji: "🐯" },
      { name: "Jameela", emoji: "🦁" },
      { name: "Lakshya", emoji: "🐨" },
      { name: "Meena", emoji: "🐷" },
      { name: "Krithiga", emoji: "🐻" }
    ];

    const taskInput = document.getElementById("taskInput");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");
    const addTaskButton = document.getElementById("addTask");
    const taskList = document.getElementById("taskList");
    const friendSelect = document.getElementById("friendSelect");

    const db = firebase.database();

    function populateFriendDropdown() {
      friendSelect.innerHTML = '';
      friends.forEach(friend => {
        const opt = document.createElement("option");
        opt.value = friend.name;
        opt.textContent = `${friend.emoji} ${friend.name}`;
        friendSelect.appendChild(opt);
      });
    }

    populateFriendDropdown();

    function getCurrentUser() {
      return friendSelect.value;
    }

    addTaskButton.addEventListener("click", () => {
      const text = taskInput.value.trim();
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      
      if (text) {
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          alert("End date must be after start date!");
          return;
        }

        const newTask = {
          text,
          startDate: startDate || null,
          endDate: endDate || null,
          pending: friends.map(f => f.name),
          createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        const taskRef = db.ref("sharedTasks").push();
        taskRef.set(newTask)
          .then(() => {
            taskInput.value = "";
            startDateInput.value = "";
            endDateInput.value = "";
          })
          .catch(error => {
            console.error("Error adding task: ", error);
          });
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

      if (taskData.startDate || taskData.endDate) {
        const datesPara = document.createElement("p");
        datesPara.className = "task-dates";
        
        let datesText = "";
        if (taskData.startDate && taskData.endDate) {
          datesText = `📅 ${formatDate(taskData.startDate)} - ${formatDate(taskData.endDate)}`;
        } else if (taskData.startDate) {
          datesText = `⏳ Starts: ${formatDate(taskData.startDate)}`;
        } else if (taskData.endDate) {
          datesText = `⏰ Ends: ${formatDate(taskData.endDate)}`;
        }
        
        datesPara.textContent = datesText;
        li.appendChild(datesPara);
      }

      const emojiWrapper = document.createElement("div");
      emojiWrapper.className = "emoji";

      if (taskData.pending && taskData.pending.length > 0) {
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
      }

      li.appendChild(emojiWrapper);
      taskList.appendChild(li);
    }

    function formatDate(dateString) {
      if (!dateString) return '';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function renderTasks(snapshot) {
      taskList.innerHTML = "";
      const tasks = snapshot.val();
      
      if (!tasks) {
        taskList.innerHTML = "<p>No tasks yet. Add one above!</p>";
        return;
      }

      const tasksArray = Object.entries(tasks).map(([id, task]) => ({ id, ...task }));
      tasksArray.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      tasksArray.forEach(task => {
        addTaskToDOM(task.id, task);
      });
    }

    db.ref("sharedTasks").on("value", renderTasks);
  }
});
