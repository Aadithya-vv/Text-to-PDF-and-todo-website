const playlistsRef = firebase.database().ref("videoPlaylists");

function addVideo() {
  const teacher = document.getElementById('teacherSelect').value;
  const chapter = document.getElementById('chapterTitle').value.trim();
  const videoUrl = document.getElementById('videoUrl').value.trim();

  if (!chapter || !videoUrl) return alert("Please fill all fields");

  const newVideoRef = playlistsRef.child(`${teacher}/${chapter}`).push();
  newVideoRef.set(videoUrl, (error) => {
    if (error) {
      alert("Error saving video.");
    } else {
      document.getElementById('videoUrl').value = "";
      loadPlaylists(); // Refresh display
    }
  });
}

function deleteVideo(teacher, chapter, videoKey) {
  playlistsRef.child(`${teacher}/${chapter}/${videoKey}`).remove()
    .then(() => loadPlaylists())
    .catch((err) => alert("Failed to delete video"));
}

function loadPlaylists() {
  playlistsRef.once("value", (snapshot) => {
    const data = snapshot.val() || {};
    displayPlaylists(data);
  });
}

function displayPlaylists(data) {
    const container = document.getElementById('playlistContainer');
    container.innerHTML = "";
  
    Object.entries(data).forEach(([teacher, chapters]) => {
      const teacherDiv = document.createElement('div');
      teacherDiv.className = "playlist-section";
      teacherDiv.innerHTML = `<h3>${teacher}</h3>`;
  
      Object.entries(chapters).forEach(([chapter, videos]) => {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = "chapter-section";
        chapterDiv.innerHTML = `<h4>${chapter}</h4>`;
  
        Object.entries(videos).forEach(([videoKey, url]) => {
          const wrapper = document.createElement('div');
          wrapper.className = "video-card";
  
          const videoFrame = document.createElement('iframe');
          videoFrame.src = url.replace("watch?v=", "embed/");
          videoFrame.width = "100%";
          videoFrame.height = "315";
          videoFrame.allowFullscreen = true;
  
          const delButton = document.createElement('button');
          delButton.textContent = "🗑️ Delete";
          delButton.onclick = () => deleteVideo(teacher, chapter, videoKey);
  
          wrapper.appendChild(videoFrame);
          wrapper.appendChild(delButton);
          chapterDiv.appendChild(wrapper);
        });
  
        teacherDiv.appendChild(chapterDiv);
      });
  
      container.appendChild(teacherDiv);
    });
  }
  

window.onload = loadPlaylists;
