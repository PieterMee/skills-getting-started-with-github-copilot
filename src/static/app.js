document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activityListButtons = [];

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? `
            <div class="participants-section">
              <p class="participants-label">Participants</p>
              <div class="participants-list">
                ${details.participants
                  .map(
                    (participant) => `
                      <span class="participant-chip">
                        <span class="participant-email">${participant}</span>
                        <button
                          class="participant-remove-btn"
                          data-activity="${name}"
                          data-email="${participant}"
                          type="button"
                          aria-label="Remove ${participant} from ${name}"
                        >
                          ✕
                        </button>
                      </span>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
          : `
            <div class="participants-section empty">
              <p class="participants-label">Participants</p>
              <p class="participants-empty">No one has signed up yet.</p>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      activityListButtons = document.querySelectorAll(".participant-remove-btn");
      activityListButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const activityName = button.dataset.activity;
          const participantEmail = button.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participantEmail)}`,
              {
                method: "DELETE",
              }
            );

            const result = await response.json();

            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              await fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Unable to remove participant";
              messageDiv.className = "error";
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to remove participant.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error removing participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
