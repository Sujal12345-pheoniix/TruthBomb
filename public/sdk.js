(function() {
  if (window.Kenzo) {
    console.warn("Kenzo SDK already loaded.");
    return;
  }

  // Get or create unique user ID
  let userId = localStorage.getItem("kenzo_user_id");
  if (!userId) {
    userId = "usr_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("kenzo_user_id", userId);
  }

  const Kenzo = {
    config: {
      apiKey: "",
      apiBaseUrl: ""
    },
    initialized: false,
    tours: [],
    faqs: [],
    completedTours: [],
    activeTour: null,
    activeStepIndex: -1,
    
    // Injected elements references
    launcherEl: null,
    panelEl: null,
    popoverEl: null,
    backdropEl: null,

    init: function(config) {
      if (this.initialized) return;
      this.initialized = true;
      this.config = Object.assign(this.config, config);
      console.log("Kenzo DAP initialized with user ID:", userId);

      // Inject CSS Styles
      this.injectStyles();

      // Fetch configurations and user progress
      this.fetchData();

      // Check if there is an active tour pending from localStorage (cross-page state)
      this.checkPendingTour();
    },

    injectStyles: function() {
      const css = `
        /* Floating Launcher */
        .kenzo-launcher {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1f6ab2 0%, #0e2f54 100%);
          box-shadow: 0 4px 20px rgba(14, 47, 84, 0.4);
          cursor: pointer;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .kenzo-launcher:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 6px 24px rgba(14, 47, 84, 0.5);
        }
        .kenzo-launcher-badge {
          position: absolute;
          right: 64px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(14, 47, 84, 0.15);
          color: #0e2f54;
          padding: 6px 12px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.3s;
          pointer-events: none;
        }
        .kenzo-launcher:hover .kenzo-launcher-badge {
          opacity: 1;
          transform: translateX(0);
        }
        
        /* Pulse Animation */
        .kenzo-launcher::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #1f6ab2;
          opacity: 0;
          animation: kenzo-pulse 2s infinite;
        }
        @keyframes kenzo-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* Helper Panel */
        .kenzo-panel {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 360px;
          max-height: 520px;
          height: calc(100vh - 140px);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          z-index: 99998;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .kenzo-panel.active {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        /* Panel Header */
        .kenzo-panel-header {
          background: linear-gradient(135deg, #0e2f54 0%, #1a4a7d 100%);
          padding: 16px 20px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kenzo-panel-title {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kenzo-panel-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.2s;
        }
        .kenzo-panel-close:hover {
          color: white;
        }

        /* Navigation Tabs */
        .kenzo-tabs {
          display: flex;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
        }
        .kenzo-tab {
          flex: 1;
          text-align: center;
          padding: 10px 0;
          font-size: 12px;
          font-weight: 600;
          color: #54708b;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .kenzo-tab.active {
          color: #0e2f54;
          border-bottom-color: #1f6ab2;
          background: rgba(255, 255, 255, 0.5);
        }

        /* Panel Body Content */
        .kenzo-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .kenzo-content-section {
          display: none;
        }
        .kenzo-content-section.active {
          display: block;
        }

        /* Tour Cards List */
        .kenzo-tour-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 10px;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .kenzo-tour-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: rgba(31, 106, 178, 0.25);
        }
        .kenzo-tour-info h4 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 600;
          color: #0e2f54;
        }
        .kenzo-tour-info p {
          margin: 0;
          font-size: 11px;
          color: #6a839c;
          line-height: 1.4;
        }
        .kenzo-tour-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
        }
        .kenzo-tour-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .kenzo-tour-badge.recommended {
          background: #eef5ff;
          color: #1f6ab2;
        }
        .kenzo-tour-badge.completed {
          background: #e6f7ed;
          color: #1eb260;
        }
        .kenzo-tour-badge.other {
          background: #f1f3f5;
          color: #6c757d;
        }
        .kenzo-btn-start {
          background: linear-gradient(135deg, #1f6ab2 0%, #0e2f54 100%);
          border: none;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .kenzo-btn-start:hover {
          opacity: 0.9;
        }

        /* Progress Bar (Overall) */
        .kenzo-progress-box {
          background: #f7f9fc;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .kenzo-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: #4a5d71;
          margin-bottom: 6px;
        }
        .kenzo-progress-bar-bg {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }
        .kenzo-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #1f6ab2, #1eb260);
          width: 0%;
          transition: width 0.4s ease;
        }

        /* FAQ Styling */
        .kenzo-search {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d2dbe5;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .kenzo-search:focus {
          outline: none;
          border-color: #1f6ab2;
          box-shadow: 0 0 0 2px rgba(31, 106, 178, 0.1);
        }
        .kenzo-faq-item {
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 8px 0;
        }
        .kenzo-faq-question {
          font-size: 12px;
          font-weight: 600;
          color: #0e2f54;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kenzo-faq-answer {
          font-size: 11px;
          color: #4a5f73;
          margin-top: 4px;
          line-height: 1.4;
          display: none;
        }
        .kenzo-faq-item.active .kenzo-faq-answer {
          display: block;
        }

        /* Feedback Styling */
        .kenzo-feedback-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .kenzo-feedback-form label {
          font-size: 11px;
          font-weight: 600;
          color: #4a5f73;
        }
        .kenzo-feedback-form textarea {
          width: 100%;
          height: 80px;
          padding: 8px;
          border: 1px solid #d2dbe5;
          border-radius: 6px;
          font-size: 12px;
          resize: none;
          box-sizing: border-box;
        }
        .kenzo-feedback-form textarea:focus {
          outline: none;
          border-color: #1f6ab2;
        }
        .kenzo-feedback-submit {
          background: linear-gradient(135deg, #1f6ab2 0%, #0e2f54 100%);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .kenzo-feedback-submit:hover {
          opacity: 0.9;
        }
        .kenzo-feedback-success {
          background: #e6f7ed;
          color: #1eb260;
          border: 1px solid rgba(30, 178, 96, 0.2);
          border-radius: 6px;
          padding: 10px;
          font-size: 11px;
          text-align: center;
          display: none;
        }

        /* Spotlight Highlighting Overlay */
        .kenzo-active-target {
          position: relative !important;
          z-index: 100002 !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 15px rgba(31, 106, 178, 0.6) !important;
          pointer-events: auto !important;
          transition: box-shadow 0.3s ease !important;
        }

        /* Popover Step Card */
        .kenzo-popover {
          position: absolute;
          z-index: 100003;
          width: 280px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: auto;
        }
        .kenzo-popover.active {
          opacity: 1;
          transform: translateY(0);
        }
        .kenzo-popover-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: #6a839c;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .kenzo-popover h3 {
          margin: 0 0 6px 0;
          font-size: 14px;
          font-weight: 700;
          color: #0e2f54;
        }
        .kenzo-popover p {
          margin: 0 0 12px 0;
          font-size: 12px;
          color: #4a5f73;
          line-height: 1.4;
        }
        .kenzo-popover-progress {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .kenzo-popover-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1f6ab2, #e8460a);
          width: 0%;
          transition: width 0.3s;
        }
        .kenzo-popover-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kenzo-btn-skip {
          background: none;
          border: none;
          color: #6a839c;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }
        .kenzo-btn-skip:hover {
          color: #0e2f54;
        }
        .kenzo-btn-nav {
          background: #f1f3f5;
          border: 1px solid rgba(0,0,0,0.06);
          color: #0e2f54;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 6px;
        }
        .kenzo-btn-nav:hover {
          background: #e2e8f0;
        }
        .kenzo-btn-next {
          background: linear-gradient(135deg, #1f6ab2 0%, #0e2f54 100%);
          border: none;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .kenzo-btn-next:hover {
          opacity: 0.9;
        }
        
        /* Backdrop mask */
        .kenzo-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100001;
          background: rgba(0,0,0,0.25);
          backdrop-filter: blur(1.5px);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .kenzo-backdrop.active {
          opacity: 1;
          pointer-events: auto;
        }
      `;
      const styleEl = document.createElement("style");
      styleEl.appendChild(document.createTextNode(css));
      document.head.appendChild(styleEl);
    },

    fetchData: function() {
      const self = this;
      
      // 1. Fetch Tours & FAQs
      fetch(this.config.apiBaseUrl + "/tours")
        .then(res => res.json())
        .then(data => {
          self.tours = data.tours || [];
          self.faqs = data.faqs || [];
          self.renderToursList();
          self.renderFAQsList();
          self.updateProgressBar();
        })
        .catch(err => console.error("Error loading Kenzo tours:", err));

      // 2. Fetch Progress
      fetch(this.config.apiBaseUrl + "/progress?userId=" + userId)
        .then(res => res.json())
        .then(data => {
          self.completedTours = data.completedTours || [];
          self.renderToursList();
          self.updateProgressBar();
        })
        .catch(err => console.error("Error loading Kenzo progress:", err));
    },

    setupUI: function() {
      const self = this;

      // Create Backdrop Mask
      const backdrop = document.createElement("div");
      backdrop.className = "kenzo-backdrop";
      document.body.appendChild(backdrop);
      this.backdropEl = backdrop;

      // Create Floating Launcher Button
      const launcher = document.createElement("div");
      launcher.className = "kenzo-launcher";
      launcher.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles" style="color: white;"><path d="M12 3v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1z"/><path d="M4 12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z"/><path d="M20 12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1z"/><path d="M12 20v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1z"/><path d="m5.5 5.5.7.7a1 1 0 0 0 1.4 0l.7-.7a1 1 0 0 0 0-1.4l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4z"/><path d="m17.5 17.5.7.7a1 1 0 0 0 1.4 0l.7-.7a1 1 0 0 0 0-1.4l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4z"/><path d="m17.5 5.5.7.7a1 1 0 0 0 1.4 0l.7-.7a1 1 0 0 0 0-1.4l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4z"/><path d="m5.5 17.5.7.7a1 1 0 0 0 1.4 0l.7-.7a1 1 0 0 0 0-1.4l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4z"/></svg>
        <span class="kenzo-launcher-badge">✨ Quick Platform Tour</span>
      `;
      launcher.addEventListener("click", () => self.togglePanel());
      document.body.appendChild(launcher);
      this.launcherEl = launcher;

      // Create Assistant Panel
      const panel = document.createElement("div");
      panel.className = "kenzo-panel";
      panel.innerHTML = `
        <div class="kenzo-panel-header">
          <h3 class="kenzo-panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap" style="color: #ff9100;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Kenzo Onboarding
          </h3>
          <button class="kenzo-panel-close">&times;</button>
        </div>
        <div class="kenzo-tabs">
          <div class="kenzo-tab active" data-tab="tours">Guide Tours</div>
          <div class="kenzo-tab" data-tab="faq">FAQ Docs</div>
          <div class="kenzo-tab" data-tab="feedback">Feedback</div>
        </div>
        <div class="kenzo-panel-body">
          <!-- Tours Tab -->
          <div class="kenzo-content-section active" id="kenzo-tab-tours">
            <div class="kenzo-progress-box">
              <div class="kenzo-progress-label">
                <span>Your Onboarding Progress</span>
                <span class="kenzo-progress-percent">0%</span>
              </div>
              <div class="kenzo-progress-bar-bg">
                <div class="kenzo-progress-bar-fill"></div>
              </div>
            </div>
            <div class="kenzo-tours-list-container">
              <p style="font-size: 12px; color: #5c728a; text-align:center; padding: 20px;">Loading tours...</p>
            </div>
          </div>
          
          <!-- FAQ Tab -->
          <div class="kenzo-content-section" id="kenzo-tab-faq">
            <input type="text" class="kenzo-search" placeholder="Search topics...">
            <div class="kenzo-faqs-list-container">
              <!-- Rendered via js -->
            </div>
          </div>
          
          <!-- Feedback Tab -->
          <div class="kenzo-content-section" id="kenzo-tab-feedback">
            <div class="kenzo-feedback-success">Thank you! Your feedback has been received.</div>
            <form class="kenzo-feedback-form">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <label for="feedback-txt">Your message</label>
                <textarea id="feedback-txt" placeholder="Tell us about your experience..." required></textarea>
              </div>
              <button type="submit" class="kenzo-feedback-submit">Submit Feedback</button>
            </form>
          </div>
        </div>
      `;
      
      // Wire up Panel Close
      panel.querySelector(".kenzo-panel-close").addEventListener("click", () => self.togglePanel(false));

      // Wire up Tabs Switching
      const tabs = panel.querySelectorAll(".kenzo-tab");
      tabs.forEach(tab => {
        tab.addEventListener("click", function() {
          tabs.forEach(t => t.classList.remove("active"));
          panel.querySelectorAll(".kenzo-content-section").forEach(s => s.classList.remove("active"));
          
          this.classList.add("active");
          const targetSection = panel.querySelector("#kenzo-tab-" + this.getAttribute("data-tab"));
          if (targetSection) targetSection.classList.add("active");
        });
      });

      // Wire up FAQ Search
      const searchInput = panel.querySelector(".kenzo-search");
      searchInput.addEventListener("input", function(e) {
        const query = e.target.value.toLowerCase();
        const items = panel.querySelectorAll(".kenzo-faq-item");
        items.forEach(item => {
          const question = item.querySelector(".kenzo-faq-question").innerText.toLowerCase();
          const answer = item.querySelector(".kenzo-faq-answer").innerText.toLowerCase();
          if (question.includes(query) || answer.includes(query)) {
            item.style.display = "block";
          } else {
            item.style.display = "none";
          }
        });
      });

      // Wire up Feedback Submit
      const feedbackForm = panel.querySelector(".kenzo-feedback-form");
      const successMsg = panel.querySelector(".kenzo-feedback-success");
      feedbackForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const textarea = feedbackForm.querySelector("#feedback-txt");
        const val = textarea.value.trim();
        if (!val) return;

        const submitBtn = feedbackForm.querySelector(".kenzo-feedback-submit");
        submitBtn.disabled = true;
        submitBtn.innerText = "Sending...";

        fetch(self.config.apiBaseUrl + "/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, feedback: val })
        })
          .then(res => res.json())
          .then(() => {
            textarea.value = "";
            feedbackForm.style.display = "none";
            successMsg.style.display = "block";
            setTimeout(() => {
              feedbackForm.style.display = "flex";
              successMsg.style.display = "none";
              submitBtn.disabled = false;
              submitBtn.innerText = "Submit Feedback";
            }, 3000);
          })
          .catch(err => {
            console.error(err);
            alert("Error sending feedback. Try again.");
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Feedback";
          });
      });

      document.body.appendChild(panel);
      this.panelEl = panel;
    },

    togglePanel: function(show) {
      if (!this.panelEl) this.setupUI();
      const isVisible = this.panelEl.classList.contains("active");
      const shouldShow = show !== undefined ? show : !isVisible;

      if (shouldShow) {
        this.panelEl.classList.add("active");
        this.renderToursList(); // Refresh list to catch path changes
      } else {
        this.panelEl.classList.remove("active");
      }
    },

    renderToursList: function() {
      const container = this.panelEl ? this.panelEl.querySelector(".kenzo-tours-list-container") : null;
      if (!container) return;

      if (this.tours.length === 0) {
        container.innerHTML = `<p style="font-size: 12px; color: #5c728a; text-align:center; padding: 20px;">No onboarding tours available.</p>`;
        return;
      }

      const currentPath = window.location.pathname;
      let html = "";

      this.tours.forEach(tour => {
        const isCompleted = this.completedTours.includes(tour.id);
        const isCurrentPage = currentPath === tour.path;
        
        let badgeText = "Other Page";
        let badgeClass = "other";
        if (isCompleted) {
          badgeText = "✓ Completed";
          badgeClass = "completed";
        } else if (isCurrentPage) {
          badgeText = "Recommended";
          badgeClass = "recommended";
        }

        html += `
          <div class="kenzo-tour-card">
            <div class="kenzo-tour-info">
              <h4>${tour.name}</h4>
              <p>${tour.description}</p>
            </div>
            <div class="kenzo-tour-meta">
              <span class="kenzo-tour-badge ${badgeClass}">${badgeText}</span>
              <button class="kenzo-btn-start" data-tour-id="${tour.id}">
                ${isCompleted ? "Retake Tour" : "Start Tour"}
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Attach click events to Start Tour buttons
      const self = this;
      container.querySelectorAll(".kenzo-btn-start").forEach(btn => {
        btn.addEventListener("click", function() {
          const id = this.getAttribute("data-tour-id");
          self.togglePanel(false);
          self.startTour(id);
        });
      });
    },

    renderFAQsList: function() {
      const container = this.panelEl ? this.panelEl.querySelector(".kenzo-faqs-list-container") : null;
      if (!container) return;

      let html = "";
      this.faqs.forEach(faq => {
        html += `
          <div class="kenzo-faq-item">
            <div class="kenzo-faq-question">
              <span>${faq.question}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="transition: transform 0.2s;"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div class="kenzo-faq-answer">${faq.answer}</div>
          </div>
        `;
      });

      container.innerHTML = html;

      // Wire FAQ accordion click
      container.querySelectorAll(".kenzo-faq-item").forEach(item => {
        const question = item.querySelector(".kenzo-faq-question");
        question.addEventListener("click", function() {
          const isActive = item.classList.contains("active");
          container.querySelectorAll(".kenzo-faq-item").forEach(i => i.classList.remove("active"));
          const svg = item.querySelector("svg");
          
          if (!isActive) {
            item.classList.add("active");
            if (svg) svg.style.transform = "rotate(180deg)";
          } else {
            if (svg) svg.style.transform = "rotate(0deg)";
          }
        });
      });
    },

    updateProgressBar: function() {
      const percentEl = this.panelEl ? this.panelEl.querySelector(".kenzo-progress-percent") : null;
      const fillEl = this.panelEl ? this.panelEl.querySelector(".kenzo-progress-bar-fill") : null;
      if (!percentEl || !fillEl || this.tours.length === 0) return;

      const completedCount = this.completedTours.length;
      const totalCount = this.tours.length;
      const percentage = Math.round((completedCount / totalCount) * 100);

      percentEl.innerText = percentage + "%";
      fillEl.style.width = percentage + "%";
    },

    startTour: function(tourId) {
      const tour = this.tours.find(t => t.id === tourId);
      if (!tour) return;

      // If tour belongs to another page, navigate first!
      if (window.location.pathname !== tour.path) {
        localStorage.setItem("kenzo_pending_tour_id", tourId);
        localStorage.setItem("kenzo_pending_step_idx", "0");
        window.location.href = tour.path;
        return;
      }

      this.activeTour = tour;
      this.activeStepIndex = 0;
      this.backdropEl.classList.add("active");
      this.showStep();
    },

    checkPendingTour: function() {
      const pendingTourId = localStorage.getItem("kenzo_pending_tour_id");
      if (pendingTourId) {
        localStorage.removeItem("kenzo_pending_tour_id");
        localStorage.removeItem("kenzo_pending_step_idx");
        
        // Wait a small bit for React page to hydrate completely
        const self = this;
        setTimeout(() => {
          self.startTour(pendingTourId);
        }, 800);
      }
    },

    showStep: function() {
      if (!this.activeTour) return;

      const step = this.activeTour.steps[this.activeStepIndex];
      if (!step) {
        this.finishTour();
        return;
      }

      // Remove highlight from previous step
      document.querySelectorAll(".kenzo-active-target").forEach(el => {
        el.classList.remove("kenzo-active-target");
      });

      // Find target element
      const target = document.querySelector(step.selector);
      if (!target) {
        console.warn("Tour target not found:", step.selector, "skipping step.");
        this.nextStep();
        return;
      }

      // Scroll target into view
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight target element
      target.classList.add("kenzo-active-target");

      // Draw popover card
      this.renderPopover(target, step);
    },

    renderPopover: function(targetEl, step) {
      const self = this;
      if (!this.popoverEl) {
        const popover = document.createElement("div");
        popover.className = "kenzo-popover";
        document.body.appendChild(popover);
        this.popoverEl = popover;
      }

      const totalSteps = this.activeTour.steps.length;
      const stepNumber = this.activeStepIndex + 1;
      const progressPercent = Math.round((stepNumber / totalSteps) * 100);

      this.popoverEl.innerHTML = `
        <div class="kenzo-popover-header">
          <span>Onboarding Tour</span>
          <span>${stepNumber} of ${totalSteps}</span>
        </div>
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        <div class="kenzo-popover-progress">
          <div class="kenzo-popover-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="kenzo-popover-buttons">
          <button class="kenzo-btn-skip">Skip</button>
          <div>
            ${this.activeStepIndex > 0 ? `<button class="kenzo-btn-nav kenzo-btn-back">Back</button>` : ""}
            <button class="kenzo-btn-next">${stepNumber === totalSteps ? "Finish" : "Next"}</button>
          </div>
        </div>
      `;

      // Setup button click listeners
      this.popoverEl.querySelector(".kenzo-btn-skip").addEventListener("click", () => self.endTourSilently());
      if (this.activeStepIndex > 0) {
        this.popoverEl.querySelector(".kenzo-btn-back").addEventListener("click", () => self.prevStep());
      }
      this.popoverEl.querySelector(".kenzo-btn-next").addEventListener("click", () => self.nextStep());

      // Position popover relative to target element
      this.popoverEl.classList.remove("active");
      
      // We wait for scrolling to finish before positioning
      setTimeout(() => {
        self.positionPopover(targetEl, step.placement);
        self.popoverEl.classList.add("active");
      }, 350);
    },

    positionPopover: function(targetEl, placement) {
      const rect = targetEl.getBoundingClientRect();
      const popoverWidth = this.popoverEl.offsetWidth || 280;
      const popoverHeight = this.popoverEl.offsetHeight || 150;
      
      let top = 0;
      let left = 0;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

      // Handle placement logic
      switch (placement) {
        case "top":
          top = rect.top + scrollY - popoverHeight - 12;
          left = rect.left + scrollX + (rect.width - popoverWidth) / 2;
          break;
        case "bottom":
          top = rect.bottom + scrollY + 12;
          left = rect.left + scrollX + (rect.width - popoverWidth) / 2;
          break;
        case "left":
          top = rect.top + scrollY + (rect.height - popoverHeight) / 2;
          left = rect.left + scrollX - popoverWidth - 12;
          break;
        case "right":
        default:
          top = rect.top + scrollY + (rect.height - popoverHeight) / 2;
          left = rect.right + scrollX + 12;
          break;
      }

      // Constrain inside window boundaries
      const padding = 12;
      const maxLeft = window.innerWidth + scrollX - popoverWidth - padding;
      const minLeft = scrollX + padding;
      
      left = Math.max(minLeft, Math.min(left, maxLeft));

      this.popoverEl.style.top = top + "px";
      this.popoverEl.style.left = left + "px";
    },

    nextStep: function() {
      this.activeStepIndex++;
      this.showStep();
    },

    prevStep: function() {
      if (this.activeStepIndex > 0) {
        this.activeStepIndex--;
        this.showStep();
      }
    },

    finishTour: function() {
      const self = this;
      const finishedTourId = this.activeTour.id;
      
      // Clean up UI
      this.endTourSilently();

      // Submit completed progress to API
      fetch(this.config.apiBaseUrl + "/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tourId: finishedTourId })
      })
        .then(res => res.json())
        .then(data => {
          self.completedTours = data.completedTours || [];
          self.updateProgressBar();
          self.renderToursList();
          
          // Re-open panel so user sees tour is completed
          setTimeout(() => {
            self.togglePanel(true);
          }, 400);
        })
        .catch(err => console.error("Error saving tour completion:", err));
    },

    endTourSilently: function() {
      this.activeTour = null;
      this.activeStepIndex = -1;

      // Remove highlighter class
      document.querySelectorAll(".kenzo-active-target").forEach(el => {
        el.classList.remove("kenzo-active-target");
      });

      // Hide backdrop and popover
      if (this.backdropEl) this.backdropEl.classList.remove("active");
      if (this.popoverEl) this.popoverEl.classList.remove("active");
    }
  };

  // Register window export
  window.Kenzo = Kenzo;

  // Run auto initialization check in case script was added synchronously
  if (typeof window !== "undefined" && document.readyState === "complete") {
    // Wait for parent script onLoad to handle it
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      // Handled in layout loader
    });
  }
})();
