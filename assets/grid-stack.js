class GridStackSlider extends HTMLElement {
  constructor() {
    super();
    this.autoplayInterval = 4000;
    this.progressElement = document.querySelector(".splide__progress__bar");//timer
    this.initSlider();//init slider
    this.initControls();// pause/play buttons
    this.initStackSlide();//fade effect and stacking image effect
  }

  initSlider() {
    try {
      this.splide = new Splide(this, {
        type: "fade",
        rewind: true,
        drag: true,
        perPage: 1,
        rewindByDrag: true,
        arrows: true,
        waitForTransition: true,
        autoplay: true,
        resetProgress: false,
        pagination: false,
        pauseOnFocus: false,
        pauseOnHover: false
      }).mount();
    } catch (error) {
      console.error("Error initializing Splide slider:", error);
    }
  }

  initControls() {
    const pauseButton = this.querySelector(".slider-control.pause");
    const playButton = this.querySelector(".slider-control.play");

    if (pauseButton && playButton) {
      pauseButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.splide.Components.Autoplay.play();
        pauseButton.classList.add('hidden');
        playButton.classList.remove('hidden');
      });

      playButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.splide.Components.Autoplay.pause();
        playButton.classList.add('hidden');
        pauseButton.classList.remove('hidden');
      });
    } else {
      console.warn("Control buttons not found.");
    }
  }


  initStackSlide() {
    this.slides = this.splide.Components.Elements.slides;
    this.updatePagination();

    this.indexArray = [];
    this.indexArray = Array.from({ length: this.slides.length }, (_, i) => i);

    this.positions = [
      { left: "0%", top: "0", scale: 1, zIndex: 4, position: 0, opacity: 1 },
      {
        left: "8%",
        top: "0",
        scale: 0.9,
        zIndex: 3,
        position: 1,
        opacity: 0.9,
      },
      {
        left: "15%",
        top: "0",
        scale: 0.75,
        zIndex: 2,
        position: 2,
        opacity: 0.8,
      },
      {
        left: "0",
        top: "0",
        scale: 0,
        zIndex: 0,
        opacity: 0,
      },
    ];

    this.slides.forEach((slide, i) => {
      slide.setAttribute("stackPosition", i);
      this.applyStyles(slide, this.positions[i], i);
    });

      // this event fires before the slide moves
    this.splide.on(
      "move",
      this.debounce((newIndex, prevIndex) => {
        this.classList.add("loaded");
        this.updateIndex(newIndex, prevIndex);
        this.updateCss();
        this.currentSlidesElement.textContent = newIndex + 1;
      }, 100)
    );

    // this event fires after the slide moves
    this.splide.on("moved", () => {
      this.querySelector("animate")?.classList.remove("animate");
    });
    
    //this event fires after the splide mounted
    this.splide.on('mounted', function () {
      this.currentSlidesElement.textContent = splide.index + 1;
    });

  }

    applyStyles(slide, position, i) {
      if (i > 3) position = this.positions[3];
      slide.style.zIndex = position.zIndex;
      slide.style.opacity = position.opacity;
      slide.style.transform = `translate(${position.left}, ${position.top}) scale(${position.scale})`;
    }

    updateCss() {
      requestAnimationFrame(() => {
        this.indexArray.forEach((posIndex, i) => {
          const slide = this.slides[posIndex];
          const position = this.positions[i];
          slide.setAttribute("stackPosition", i);
          this.applyStyles(slide, position, i);
        });
      });
    }

    //to identify the position of each slide
    updateIndex(newIndex, prevIndex) {
      if (
        (prevIndex < newIndex && newIndex - prevIndex === 1) ||
        (newIndex === 0 && prevIndex === this.slides.length - 1)
      ) {
        const firstIndex = this.indexArray.shift();
        this.indexArray.push(firstIndex);
      } else {
        const lastIndex = this.indexArray.pop();
        this.indexArray.unshift(lastIndex);
      }
    }

    

    // update pagination
  updatePagination() {
    this.totalSlidesUpdateElement = this.querySelector(".total-slides");
    this.currentSlidesElement = this.querySelector(".current-slide");

    if (this.totalSlidesUpdateElement && this.slides.length) {
      this.totalSlidesUpdateElement.textContent = this.slides.length;
    }

    if (this.currentSlidesElement) {
      this.currentSlidesElement.textContent = 1;
    }

  }

    // Debounce function to limit the rate at which a function can fire
    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  }
  
  customElements.define("grid-stack-slider", GridStackSlider);




