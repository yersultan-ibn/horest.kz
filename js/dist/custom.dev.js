"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Custom Dropdown
4. Init Page Menu
5. Init Deals Slider
6. Init Tab Lines
7. Init Tabs
8. Init Featured Slider
9. Init Favorites
10. Init ZIndex
11. Init Popular Categories Slider
12. Init Banner 2 Slider
13. Init Arrivals Slider
14. Init Arrivals Slider ZIndex
15. Init Best Sellers Slider
16. Init Trends Slider
17. Init Reviews Slider
18. Init Recently Viewed Slider
19. Init Brands Slider
20. Init Timer


******************************/
$(document).ready(function () {
  "use strict";
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      1. Vars and Inits
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

  var _$$slick;

  var menuActive = false;
  var header = $(".header");
  setHeader();
  initCustomDropdown();
  initPageMenu();
  initDealsSlider();
  initTabLines();
  initFeaturedSlider();
  featuredSliderZIndex();
  initPopularSlider();
  initBanner2Slider();
  initFavs();
  initArrivalsSlider();
  arrivalsSliderZIndex();
  bestsellersSlider();
  initTabs();
  initTrendsSlider();
  initReviewsSlider();
  initViewedSlider();
  initBrandsSlider();
  initTimer();
  $(window).on("resize", function () {
    setHeader();
    featuredSliderZIndex();
    initTabLines();
  });
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      2. Set Header
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

  function setHeader() {
    //To pin main nav to the top of the page when it's reached
    //uncomment the following
    // var controller = new ScrollMagic.Controller(
    // {
    // 	globalSceneOptions:
    // 	{
    // 		triggerHook: 'onLeave'
    // 	}
    // });
    // var pin = new ScrollMagic.Scene(
    // {
    // 	triggerElement: '.main_nav'
    // })
    // .setPin('.main_nav').addTo(controller);
    if (window.innerWidth > 991 && menuActive) {
      closeMenu();
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      3. Init Custom Dropdown
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initCustomDropdown() {
    if ($(".custom_dropdown_placeholder").length && $(".custom_list").length) {
      var placeholder = $(".custom_dropdown_placeholder");
      var list = $(".custom_list");
    }

    if (placeholder != null) {
      placeholder.on("click", function (ev) {
        if (list.hasClass("active")) {
          list.removeClass("active");
        } else {
          list.addClass("active");
        }

        $(document).one("click", function closeForm(e) {
          if ($(e.target).hasClass("clc")) {
            $(document).one("click", closeForm);
          } else {
            list.removeClass("active");
          }
        });
      });
    }

    $(".custom_list a").on("click", function (ev) {
      ev.preventDefault();
      var index = $(this).parent().index();
      placeholder.text($(this).text()).css("opacity", "1");

      if (list.hasClass("active")) {
        list.removeClass("active");
      } else {
        list.addClass("active");
      }
    });
    $("select").on("change", function (e) {
      placeholder.text(this.value);
      $(this).animate({
        width: placeholder.width() + "px"
      });
    });
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      4. Init Page Menu
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initPageMenu() {
    if ($(".page_menu").length && $(".page_menu_content").length) {
      var menu = $(".page_menu");
      var menuContent = $(".page_menu_content");
      var menuTrigger = $(".menu_trigger"); //Open / close page menu

      menuTrigger.on("click", function () {
        if (!menuActive) {
          openMenu();
        } else {
          closeMenu();
        }
      }); //Handle page menu

      if ($(".page_menu_item").length) {
        var items = $(".page_menu_item");
        items.each(function () {
          var item = $(this);

          if (item.hasClass("has-children")) {
            item.on("click", function (evt) {
              evt.preventDefault();
              evt.stopPropagation();
              var subItem = item.find("> ul");

              if (subItem.hasClass("active")) {
                subItem.toggleClass("active");
                TweenMax.to(subItem, 0.3, {
                  height: 0
                });
              } else {
                subItem.toggleClass("active");
                TweenMax.set(subItem, {
                  height: "auto"
                });
                TweenMax.from(subItem, 0.3, {
                  height: 0
                });
              }
            });
          }
        });
      }
    }
  }

  function openMenu() {
    var menu = $(".page_menu");
    var menuContent = $(".page_menu_content");
    TweenMax.set(menuContent, {
      height: "auto"
    });
    TweenMax.from(menuContent, 0.3, {
      height: 0
    });
    menuActive = true;
  }

  function closeMenu() {
    var menu = $(".page_menu");
    var menuContent = $(".page_menu_content");
    TweenMax.to(menuContent, 0.3, {
      height: 0
    });
    menuActive = false;
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      5. Init Deals Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initDealsSlider() {
    if ($(".deals_slider").length) {
      var dealsSlider = $(".deals_slider");
      dealsSlider.owlCarousel({
        items: 1,
        loop: false,
        navClass: ["deals_slider_prev", "deals_slider_next"],
        nav: false,
        dots: false,
        smartSpeed: 1200,
        margin: 30,
        autoplay: false,
        autoplayTimeout: 5000
      });

      if ($(".deals_slider_prev").length) {
        var prev = $(".deals_slider_prev");
        prev.on("click", function () {
          dealsSlider.trigger("prev.owl.carousel");
        });
      }

      if ($(".deals_slider_next").length) {
        var next = $(".deals_slider_next");
        next.on("click", function () {
          dealsSlider.trigger("next.owl.carousel");
        });
      }
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      6. Init Tab Lines
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initTabLines() {
    if ($(".tabs").length) {
      var tabs = $(".tabs");
      tabs.each(function () {
        var tabsItem = $(this);
        var tabsLine = tabsItem.find(".tabs_line span");
        var tabGroup = tabsItem.find("ul li");
        var posX = $(tabGroup[0]).position().left;
        tabsLine.css({
          left: posX,
          width: $(tabGroup[0]).width()
        });
        tabGroup.each(function () {
          var tab = $(this);
          tab.on("click", function () {
            if (!tab.hasClass("active")) {
              tabGroup.removeClass("active");
              tab.toggleClass("active");
              var tabXPos = tab.position().left;
              var tabWidth = tab.width();
              tabsLine.css({
                left: tabXPos,
                width: tabWidth
              });
            }
          });
        });
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      7. Init Tabs
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initTabs() {
    if ($(".tabbed_container").length) {
      //Handle tabs switching
      var tabsContainers = $(".tabbed_container");
      tabsContainers.each(function () {
        var tabContainer = $(this);
        var tabs = tabContainer.find(".tabs ul li");
        var panels = tabContainer.find(".panel");
        var sliders = panels.find(".slider");
        tabs.each(function () {
          var tab = $(this);
          tab.on("click", function () {
            panels.removeClass("active");
            var tabIndex = tabs.index(this);
            $($(panels[tabIndex]).addClass("active"));
            sliders.slick("unslick");
            sliders.each(function () {
              var slider = $(this); // slider.slick("unslick");

              if (slider.hasClass("bestsellers_slider")) {
                initBSSlider(slider);
              }

              if (slider.hasClass("featured_slider")) {
                initFSlider(slider);
              }

              if (slider.hasClass("arrivals_slider")) {
                initASlider(slider);
              }
            });
          });
        });
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      8. Init Featured Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initFeaturedSlider() {
    if ($(".featured_slider").length) {
      var featuredSliders = $(".featured_slider");
      featuredSliders.each(function () {
        var featuredSlider = $(this);
        initFSlider(featuredSlider);
      });
    }
  }

  function initFSlider(fs) {
    var featuredSlider = fs;
    featuredSlider.on("init", function () {
      var activeItems = featuredSlider.find(".slick-slide.slick-active");

      for (var x = 0; x < activeItems.length - 1; x++) {
        var item = $(activeItems[x]);
        item.find(".border_active").removeClass("active");

        if (item.hasClass("slick-active")) {
          item.find(".border_active").addClass("active");
        }
      }
    }).on({
      afterChange: function afterChange(event, slick, current_slide_index, next_slide_index) {
        var activeItems = featuredSlider.find(".slick-slide.slick-active");
        activeItems.find(".border_active").removeClass("active");

        for (var x = 0; x < activeItems.length - 1; x++) {
          var item = $(activeItems[x]);
          item.find(".border_active").removeClass("active");

          if (item.hasClass("slick-active")) {
            item.find(".border_active").addClass("active");
          }
        }
      }
    }); // .slick({
    //     rows: 2,
    //     slidesToShow: 4,
    //     slidesToScroll: 4,
    //     infinite: false,
    //     arrows: false,
    //     dots: true,
    //     responsive: [{
    //             breakpoint: 768,
    //             settings: {
    //                 rows: 2,
    //                 slidesToShow: 3,
    //                 slidesToScroll: 3,
    //                 dots: true
    //             }
    //         },
    //         {
    //             breakpoint: 575,
    //             settings: {
    //                 rows: 2,
    //                 slidesToShow: 2,
    //                 slidesToScroll: 2,
    //                 dots: false
    //             }
    //         },
    //         {
    //             breakpoint: 480,
    //             settings: {
    //                 rows: 1,
    //                 slidesToShow: 1,
    //                 slidesToScroll: 1,
    //                 dots: false
    //             }
    //         }
    //     ]
    // });
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      9. Init Favorites
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initFavs() {
    // Handle Favorites
    var items = document.getElementsByClassName("product_fav");

    for (var x = 0; x < items.length; x++) {
      var item = items[x];
      item.addEventListener("click", function (fn) {
        fn.target.classList.toggle("active");
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      10. Init ZIndex
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function featuredSliderZIndex() {
    // Hide slider dots on item hover
    var items = document.getElementsByClassName("featured_slider_item");

    for (var x = 0; x < items.length; x++) {
      var item = items[x];
      item.addEventListener("mouseenter", function () {
        $(".featured_slider .slick-dots").css("display", "none");
      });
      item.addEventListener("mouseleave", function () {
        $(".featured_slider .slick-dots").css("display", "block");
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      11. Init Popular Categories Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initPopularSlider() {
    if ($(".popular_categories_slider").length) {
      var popularSlider = $(".popular_categories_slider");
      popularSlider.owlCarousel({
        loop: true,
        autoplay: false,
        nav: false,
        dots: false,
        responsive: {
          0: {
            items: 1
          },
          575: {
            items: 2
          },
          640: {
            items: 3
          },
          768: {
            items: 4
          },
          991: {
            items: 5
          }
        }
      });

      if ($(".popular_categories_prev").length) {
        var prev = $(".popular_categories_prev");
        prev.on("click", function () {
          popularSlider.trigger("prev.owl.carousel");
        });
      }

      if ($(".popular_categories_next").length) {
        var next = $(".popular_categories_next");
        next.on("click", function () {
          popularSlider.trigger("next.owl.carousel");
        });
      }
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      12. Init Banner 2 Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initBanner2Slider() {
    if ($(".banner_2_slider").length) {
      var banner2Slider = $(".banner_2_slider");
      banner2Slider.owlCarousel({
        items: 1,
        loop: true,
        nav: false,
        dots: true,
        dotsContainer: ".banner_2_dots",
        smartSpeed: 1200
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      13. Init Arrivals Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initArrivalsSlider() {
    if ($(".arrivals_slider").length) {
      var arrivalsSliders = $(".arrivals_slider");
      arrivalsSliders.each(function () {
        var arrivalsSlider = $(this);
        initASlider(arrivalsSlider);
      });
    }
  }

  function initASlider(as) {
    var arrivalsSlider = as;
    arrivalsSlider.on("init", function () {
      var activeItems = arrivalsSlider.find(".slick-slide.slick-active");

      for (var x = 0; x < activeItems.length - 1; x++) {
        var item = $(activeItems[x]);
        item.find(".border_active").removeClass("active");

        if (item.hasClass("slick-active")) {
          item.find(".border_active").addClass("active");
        }
      }
    }).on({
      afterChange: function afterChange(event, slick, current_slide_index, next_slide_index) {
        var activeItems = arrivalsSlider.find(".slick-slide.slick-active");
        activeItems.find(".border_active").removeClass("active");

        for (var x = 0; x < activeItems.length - 1; x++) {
          var item = $(activeItems[x]);
          item.find(".border_active").removeClass("active");

          if (item.hasClass("slick-active")) {
            item.find(".border_active").addClass("active");
          }
        }
      }
    }).slick({
      rows: 2,
      slidesToShow: 5,
      slidesToScroll: 5,
      infinite: false,
      arrows: false,
      dots: true,
      responsive: [{
        breakpoint: 768,
        settings: {
          rows: 2,
          slidesToShow: 3,
          slidesToScroll: 3,
          dots: true
        }
      }, {
        breakpoint: 575,
        settings: {
          rows: 2,
          slidesToShow: 2,
          slidesToScroll: 2,
          dots: false
        }
      }, {
        breakpoint: 480,
        settings: {
          rows: 1,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: false
        }
      }]
    });
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      14. Init Arrivals Slider ZIndex
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function arrivalsSliderZIndex() {
    // Hide slider dots on item hover
    var items = document.getElementsByClassName("arrivals_slider_item");

    for (var x = 0; x < items.length; x++) {
      var item = items[x];
      item.addEventListener("mouseenter", function () {
        $(".arrivals_slider .slick-dots").css("display", "none");
      });
      item.addEventListener("mouseleave", function () {
        $(".arrivals_slider .slick-dots").css("display", "block");
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      15. Init Best Sellers Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function bestsellersSlider() {
    if ($(".bestsellers_slider").length) {
      var bestsellersSliders = $(".bestsellers_slider");
      bestsellersSliders.each(function () {
        var bestsellersSlider = $(this);
        initBSSlider(bestsellersSlider);
      });
    }
  }

  function initBSSlider(bss) {
    var bestsellersSlider = bss;
    bestsellersSlider.slick({
      rows: 2,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 3,
      arrows: false,
      dots: true,
      autoplay: true,
      autoplaySpeed: 6000,
      responsive: [{
        breakpoint: 1199,
        settings: {
          rows: 2,
          slidesToShow: 2,
          slidesToScroll: 2,
          dots: true
        }
      }, {
        breakpoint: 991,
        settings: {
          rows: 2,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true
        }
      }, {
        breakpoint: 575,
        settings: {
          rows: 1,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: false
        }
      }]
    });
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      16. Init Trends Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initTrendsSlider() {
    if ($(".trends_slider").length) {
      var trendsSlider = $(".trends_slider");
      trendsSlider.owlCarousel({
        loop: false,
        margin: 30,
        nav: false,
        dots: false,
        autoplayHoverPause: true,
        autoplay: false,
        responsive: {
          0: {
            items: 1
          },
          575: {
            items: 2
          },
          991: {
            items: 3
          }
        }
      });
      trendsSlider.on("click", ".trends_fav", function (ev) {
        $(ev.target).toggleClass("active");
      });

      if ($(".trends_prev").length) {
        var prev = $(".trends_prev");
        prev.on("click", function () {
          trendsSlider.trigger("prev.owl.carousel");
        });
      }

      if ($(".trends_next").length) {
        var next = $(".trends_next");
        next.on("click", function () {
          trendsSlider.trigger("next.owl.carousel");
        });
      }
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      17. Init Reviews Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initReviewsSlider() {
    if ($(".reviews_slider").length) {
      var reviewsSlider = $(".reviews_slider");
      reviewsSlider.owlCarousel({
        items: 3,
        loop: true,
        margin: 30,
        autoplay: false,
        nav: false,
        dots: true,
        dotsContainer: ".reviews_dots",
        responsive: {
          0: {
            items: 1
          },
          768: {
            items: 2
          },
          991: {
            items: 3
          }
        }
      });
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      18. Init Recently Viewed Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initViewedSlider() {
    if ($(".viewed_slider").length) {
      var viewedSlider = $(".viewed_slider");
      viewedSlider.owlCarousel({
        loop: true,
        margin: 5,
        autoplay: true,
        autoplayTimeout: 3000,
        slideTransition: "linear",
        autoplaySpeed: 600,
        autoplayHoverPause: true,
        nav: false,
        dots: false,
        responsive: {
          0: {
            items: 2
          },
          575: {
            items: 2
          },
          767: {
            items: 3
          },
          900: {
            items: 4
          },
          1000: {
            items: 4
          },
          1250: {
            items: 5
          }
        }
      });

      if ($(".viewed_prev").length) {
        var prev = $(".viewed_prev");
        prev.on("click", function () {
          viewedSlider.trigger("prev.owl.carousel");
        });
      }

      if ($(".viewed_next").length) {
        var next = $(".viewed_next");
        next.on("click", function () {
          viewedSlider.trigger("next.owl.carousel");
        });
      }
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      19. Init Brands Slider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initBrandsSlider() {
    if ($(".brands_slider").length) {
      var brandsSlider = $(".brands_slider");
      brandsSlider.owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        nav: false,
        dots: false,
        autoWidth: true,
        items: 8,
        margin: 42
      });

      if ($(".brands_prev").length) {
        var prev = $(".brands_prev");
        prev.on("click", function () {
          brandsSlider.trigger("prev.owl.carousel");
        });
      }

      if ($(".brands_next").length) {
        var next = $(".brands_next");
        next.on("click", function () {
          brandsSlider.trigger("next.owl.carousel");
        });
      }
    }
  }
  /* 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      20. Init Timer
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


  function initTimer() {
    if ($(".deals_timer_box").length) {
      var timers = $(".deals_timer_box");
      timers.each(function () {
        var timer = $(this);
        var targetTime;
        var target_date; // Add a date to data-target-time of the .deals_timer_box
        // Format: "Feb 17, 2018"

        if (timer.data("target-time") !== "") {
          targetTime = timer.data("target-time");
          target_date = new Date(targetTime).getTime();
        } else {
          var date = new Date();
          date.setDate(date.getDate() + 2);
          target_date = date.getTime();
        } // variables for time units


        var days, hours, minutes, seconds;
        var h = timer.find(".deals_timer_hr");
        var m = timer.find(".deals_timer_min");
        var s = timer.find(".deals_timer_sec");
        setInterval(function () {
          // find the amount of "seconds" between now and target
          var current_date = new Date().getTime();
          var seconds_left = (target_date - current_date) / 1000;
          console.log(seconds_left); // do some time calculations

          days = parseInt(seconds_left / 86400);
          seconds_left = seconds_left % 86400;
          hours = parseInt(seconds_left / 3600);
          hours = hours + days * 24;
          seconds_left = seconds_left % 3600;
          minutes = parseInt(seconds_left / 60);
          seconds = parseInt(seconds_left % 60);

          if (hours.toString().length < 2) {
            hours = "0" + hours;
          }

          if (minutes.toString().length < 2) {
            minutes = "0" + minutes;
          }

          if (seconds.toString().length < 2) {
            seconds = "0" + seconds;
          } // display results


          h.text(hours);
          m.text(minutes);
          s.text(seconds);
        }, 1000);
      });
    }
  } // input logic


  var inputActiveOnTyping = document.querySelector(".super-input");
  var hoverActive = document.querySelector(".search-input-box");
  inputActiveOnTyping.addEventListener("input", function (_ref) {
    var target = _ref.target;

    if (target.value.trim()) {
      hoverActive.classList.add("active");
    } else {
      hoverActive.classList.remove("active");
    }
  }); // _________________________________________________________________________________________________________
  // const header_container = document.querySelector(".super_container");

  header_container.innerHTML = "\n    <header class=\"header\">\n\n    <div class=\"header_main\">\n\n        <div class=\"header_menu\">\n\n        \n        <div class=\"header_menu_items\">\n        \n        \n        <a class=\"go_back\" onclick=\"history.back()\">\n            <img class=\"go_back_img\" src=\"/images/left-arrow.png\" alt=\"\">\n        </a>\n                <div class=\"topLogo\">\n                    <div class=\"logo_container\">\n                        <div class=\"logo\">\n                            <a href=\"index.html\"><img src=\"images/logo.png\"></a>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"topMenu\">\n                    <ul class=\"standard_dropdown main_nav_dropdown\">\n                        <li><a href=\"index.html\">\u0413\u043B\u0430\u0432\u043D\u0430\u044F<i class=\"fas fa-chevron-down\"></i></a></li>\n                        <li>\n                            <a href=\"design.html\">3D \u0414\u0438\u0437\u0430\u0439\u043D<i class=\"fas fa-chevron-down\"></i></a>\n\n                        </li>\n                        <li>\n                            <a href=\"delivery.html\">\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430<i class=\"fas fa-chevron-down\"></i></a>\n\n                        </li>\n                        <li>\n                            <a href=\"about.html\">\u041E \u043D\u0430\u0441<i class=\"fas fa-chevron-down\"></i></a>\n\n                        </li>\n                        <li>\n                            <a href=\"otzyvy.php\">\u041E\u0442\u0437\u044B\u0432\u044B<i class=\"fas fa-chevron-down\"></i></a>\n\n                        </li>\n                        <li>\n                            <a href=\"contact.html\"><img class=\"ikonka1\" src=\"images/icon.png\">\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B<i class=\"fas fa-chevron-down\"></i></a>\n                        </li>\n                    </ul>\n                </div>\n                <!-- ___________________Burger menu start_______________________ -->\n                \n                <div class=\"wrapper\" id=\"wrapper2\">\n                    <div id=\"select_wrap\" class=\"select_wrap\">\n                        <ul class=\"default_option\">\n                            <li>\n                                <a>\n                                    <div class=\"option\">\n                                        <div class=\"coccoc-alo-phone coccoc-alo-green coccoc-alo-show\">\n                                            <div class=\"coccoc-alo-ph-circle\"></div>\n                                            <div class=\"coccoc-alo-ph-circle-fill\"></div>\n                                            <div class=\"coccoc-alo-ph-img-circle\"></div>\n                                        </div>\n                                        <a class=\"tel-title-main\" href=\"tel:87273449900\"><span class=\"tel-title\">\u0410\u043B\u043C\u0430\u0442\u044B</span><span class=\"tel-number\">8(727) <span class=\"tel-number-2\"> 344-99-00 </span> </span></a>\n                                    </div>\n                                </a>\n                            </li>\n                        </ul>\n                        <ul class=\"select_ul\">\n                            <li class=\"almaty-contact-list\">\n                                    <div class=\"option\">\n                                    <div><span class=\"tel-title\">\u0410\u043B\u043C\u0430\u0442\u044B</span> <div class=\"tel-number-main\"> <a href=\"tel:87273449900\"> <span class=\"tel-number\">8(727) <span class=\"tel-number-2\"> 344-99-00 </span> </span> </a> <a href=\"tel:87012667700\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 266-77-00 </span> </span> </a> </div></a> </div>\n                                    </div>\n                            </li>\n                            <li>\n                                    <div class=\"option\">\n                                        <div><span class=\"tel-title\">\u0410\u0441\u0442\u0430\u043D\u0430</span> <div class=\"tel-number-main\"> <a href=\"tel:87172279900\"> <span class=\"tel-number\">8(7172) <span class=\"tel-number-2\"> 27-99-00 </span> </span> </a> <a href=\"tel:87172279900\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 511-22-00 </span> </span> </a> </div></a> </div>\n                                    </div>\n                            </li>\n                            <li>\n                                    <div class=\"option\">\n                                        <div><span class=\"tel-title\">\u0428\u044B\u043C\u043A\u0435\u043D\u0442</span><div class=\"tel-number-main\"> <a href=\"tel:87252399900\"> <span class=\"tel-number\">8(7252) <span class=\"tel-number-2\"> 39-99-00 </span> </span> </a> <a href=\"tel:87019447700\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 944-77-00 </span> </span> </a> </div> </div>\n                                    </div>\n                            </li>\n                        </ul>\n                    </div>\n                </div>\n                \n                \n                <!--<div class=\"burger_container\">\n                    <a class=\"nav-button ml-auto mr-4\">\n                        <span id=\"nav-icon3\">\n                        <span></span>\n                        <span></span>\n                        <span></span>\n                        <span></span>\n                        </span>\n                    </a>\n                </div>-->\n            </div>\n            <div class=\"fixed-top dineuron-menu\">\n                <div class=\"flex-center p-5\">\n                    <ul class=\"nav flex-column\">\n                        <li class=\"nav-item delay-1\"><a class=\"nav-link\" href=\"index.html\">\u0413\u043B\u0430\u0432\u043D\u0430\u044F</a></li>\n                        <li class=\"nav-item delay-2\"><a class=\"nav-link\" href=\"catalog.html\">\u0422\u043E\u0432\u0430\u0440\u044B</a></li>\n                        <li class=\"nav-item delay-3\"><a class=\"nav-link\" href=\"design.html\">3D \u0414\u0438\u0437\u0430\u0439\u043D</a></li>\n                        <li class=\"nav-item delay-4\"><a class=\"nav-link\" href=\"delivery.html\">\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430</a></li>\n                        <li class=\"nav-item delay-5\"><a class=\"nav-link\" href=\"about.html\">\u041E \u043D\u0430\u0441</a></li>\n                        <li class=\"nav-item delay-6\"><a class=\"nav-link\" href=\"otzyvy.php\">\u041E\u0442\u0437\u044B\u0432\u044B</a></li>\n                        <li class=\"nav-item delay-7\"><a class=\"nav-link\" href=\"contact.html\">\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B</a></li>\n                    </ul>\n                </div>\n            </div>\n            <!-- ___________________Burger menu end_______________________ -->\n        </div>\n    </div>\n\n    <nav class=\"main_nav\">\n\n        <div class=\"row\">\n            <div class=\"col header2_content\">\n\n                <div class=\"main_nav_content d-flex flex-row\">\n\n                    <div id=\"cat_menu_container\" class=\"cat_menu_container\">\n                        <a href=\"catalog.html\">\n                            <div class=\"cat_menu_title d-flex flex-row align-items-center justify-content-start\">\n                                <div id=\"nav-icon3-2\" class=\"cat_burger\">\n                                    <span></span>\n                                    <span></span>\n                                    <span></span>\n                                    <span></span>\n                                </div>\n                                <div class=\"cat_menu_text\">\u0422\u043E\u0432\u0430\u0440\u044B</div>\n                            </div>\n                        </a>\n                    </div>\n\n\n                    <!--<li id=\"open\">\n                        <a style=\"padding: 0px; cursor: pointer;\"><img style=\" width:30.5px; padding: 8px 5px 7px 5px\" src=\"/themes/images/cart-icon-png-white-4.png\" />\n                            <span class=\"badge badge-notify my-cart-badge\">\n                                <div class=\"label-place\"></div>\n                            </span>\n                        </a>\n                    </li>-->\n\n                    \n                    <div class=\"basket_contacts\">\n                        <div class=\"wrapper\" id=\"wrapper1\">\n                            <div id=\"select_wrap\" class=\"select_wrap\">\n                                <ul class=\"default_option\">\n                                    <li>\n                                        <a>\n                                            <div class=\"option\">\n                                                <div class=\"coccoc-alo-phone coccoc-alo-green coccoc-alo-show\">\n                                                    <div class=\"coccoc-alo-ph-circle\"></div>\n                                                    <div class=\"coccoc-alo-ph-circle-fill\"></div>\n                                                    <div class=\"coccoc-alo-ph-img-circle\"></div>\n                                                </div>\n                                                <a style=\"gap: 24px\" class=\"tel-title-main\" href=\"tel:87273449900\"><span class=\"tel-title\">\u0410\u043B\u043C\u0430\u0442\u044B</span><span class=\"tel-number\">8(727) <span class=\"tel-number-2\"> 344-99-00 </span> </span></a>\n                                            </div>\n                                        </a>\n                                    </li>\n                                </ul>\n                                <ul class=\"select_ul\">\n                                    <li class=\"almaty-contact-list\">\n                                            <div class=\"option\">\n                                            <div><span class=\"tel-title\">\u0410\u043B\u043C\u0430\u0442\u044B</span> <div class=\"tel-number-main\"> <a href=\"tel:87273449900\"> <span class=\"tel-number\">8(727) <span class=\"tel-number-2\"> 344-99-00 </span> </span> </a> <a href=\"tel:87012667700\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 266-77-00 </span> </span> </a> </div></a> </div>\n                                            </div>\n                                    </li>\n                                    <li>\n                                            <div class=\"option\">\n                                                <div><span class=\"tel-title\">\u0410\u0441\u0442\u0430\u043D\u0430</span> <div class=\"tel-number-main\"> <a href=\"tel:87172279900\"> <span class=\"tel-number\">8(7172) <span class=\"tel-number-2\"> 27-99-00 </span> </span> </a> <a href=\"tel:87172279900\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 511-22-00 </span> </span> </a> </div></a> </div>\n                                            </div>\n                                    </li>\n                                    <li>\n                                            <div class=\"option\">\n                                                <div><span class=\"tel-title\">\u0428\u044B\u043C\u043A\u0435\u043D\u0442</span><div class=\"tel-number-main\"> <a href=\"tel:87252399900\"> <span class=\"tel-number\">8(7252) <span class=\"tel-number-2\"> 39-99-00 </span> </span> </a> <a href=\"tel:87019447700\"> <span class=\"tel-number\">8(701) <span class=\"tel-number-2\"> 944-77-00 </span> </span> </a> </div> </div>\n                                            </div>\n                                    </li>\n                                </ul>\n                            </div>\n                        </div>\n                        <span class=\"cart-icon image-icon\">\n                            <strong>\n                                <span class=\"badge badge-notify my-cart-badge\">\n                                    <div class=\"label-place\"></div>\n                                </span>\n                            </strong>\n                        </span>\n                    </div>\n                </div>\n\n                <div class=\"menu_trigger_container ml-auto\">\n                    <div class=\"menu_trigger d-flex flex-row align-items-center justify-content-end\">\n                        <div class=\"menu_burger\">\n                            <div class=\"menu_trigger_text\">menu</div>\n                            <div class=\"cat_burger menu_burger_inner\"><span></span><span></span><span></span></div>\n                        </div>\n                    </div>\n                </div>\n\n            </div>\n        </div>\n    </nav>\n</header>\n\n<!--_____________________________________________________________________________-->\n\n            <div class=\"menu_bar_footer\">\n                <a href=\"index.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/home.png\" alt=\"home\"></div>\n                    <span>\u0413\u043B\u0430\u0432\u043D\u0430\u044F</span>\n                </a>\n                <!-- <a href=\"products.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/list.png\" alt=\"list\"></div>\n                    <span>\u0422\u043E\u0432\u0430\u0440\u044B</span>\n                </a> -->\n                <!--<a href=\"design.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/design.png\" alt=\"design\"></div>\n                    <span>\u0414\u0438\u0437\u0430\u0439\u043D</span>\n                </a>-->\n                <a href=\"delivery.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/box3.png\" alt=\"box3\"></div>\n                    <span>\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430</span>\n                </a>\n                <a href=\"about.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/information.png\" alt=\"information\"></div>\n                    <span>\u041E&nbsp\u043D\u0430\u0441</span>\n                </a>\n                <a href=\"otzyvy.php\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/review.png\" alt=\"review\"></div>\n                    <span>\u041E\u0442\u0437\u044B\u0432\u044B</span>\n                </a>\n                <a href=\"contact.html\" class=\"menu_block\">\n                    <div class=\"menu_block_child\"><img src=\"/images/mobile_footer_menu/telephone.png\" alt=\"telephone\"></div>\n                    <span>\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B</span>\n                </a>\n            </div>\n    "; // _______________________________go back buttom will not work in this main page_________________________________

  var page_title = window.location.href.split("/").pop().split("#")[0].split("?")[0];
  var go_back = document.querySelector(".go_back");

  if (page_title == "index.html" || page_title == "products.html" || page_title == "design.html" || page_title == "delivery.html" || page_title == "about.html" || page_title == "otzyvy.php" || page_title == "contact.html") {
    go_back.style.display = "none";
  } // ____________________________________Vertical popup menu_________________________________


  var main_nav = document.createElement("nav");
  main_nav.innerHTML = "\n    <div class=\"side-bar\">\n        <div class=\"menu\">\n            <div class=\"item\">\n                <a class=\"sub-btn\">\n                    <img src=\"images/svg/1.svg\" alt=\"\"> \u0422\u0435\u043F\u043B\u043E\u0432\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                    <i class=\"fas fa-angle-right dropdown\"></i>\n                </a>\n                <div class=\"sub-menu\">\n                    <a href=\"plita.html\" class=\"sub-item\">\u041F\u043B\u0438\u0442\u044B \u044D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0435</a>\n                    <a href=\"zhar.html\" class=\"sub-item\">\u0416\u0430\u0440\u043E\u0447\u043D\u044B\u0435 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438</a>\n                    <a href=\"skovoroda.html\" class=\"sub-item\">\u0421\u043A\u043E\u0432\u043E\u0440\u043E\u0434\u044B \u044D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0435</a>\n                    <a href=\"fryer.html\" class=\"sub-item\">\u0424\u0440\u0438\u0442\u044E\u0440\u043D\u0438\u0446\u044B</a>\n                    <a href=\"poverhnost.html\" class=\"sub-item\">\u041F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0440\u0430\u0431\u043E\u0447\u0438\u0435</a>\n                    <a href=\"marmit.html\" class=\"sub-item\">\u041C\u0430\u0440\u043C\u0438\u0442\u044B \u0432\u0442\u043E\u0440\u044B\u0445 \u0431\u043B\u044E\u0434</a>\n                    <a href=\"shkaf_zhar.html\" class=\"sub-item\">\u0416\u0430\u0440\u043E\u0447\u043D\u044B\u0435 \u0448\u043A\u0430\u0444\u044B</a>\n                    <a href=\"shkaf_proofing.html\" class=\"sub-item\">\u0428\u043A\u0430\u0444\u044B \u0440\u0430\u0441\u0441\u0442\u043E\u0435\u0447\u043D\u044B\u0435</a>\n                </div>\n            </div>\n            <div class=\"item\">\n                <a href=\"salat_bary.html\">\n                    <img src=\"images/svg/3.svg\" alt=\"\"> \u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440\u044B\n                </a>\n            </div>\n            <div class=\"item\">\n                <a class=\"sub-btn\">\n                    <img src=\"images/svg/2.svg\" alt=\"\"> \u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438\n                    <i class=\"fas fa-angle-right dropdown\"></i>\n                </a>\n                <div class=\"sub-menu\">\n                    <a href=\"vega.html\" class=\"sub-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u0412\u0415\u0413\u0410</a>\n                    <a href=\"master.html\" class=\"sub-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u041C\u0430\u0441\u0442\u0435\u0440</a>\n                    <a href=\"school.html\" class=\"sub-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u0428\u043A\u043E\u043B\u044C\u043D\u0438\u043A</a>\n                </div>\n            </div>\n            <div class=\"item\">\n                <a class=\"sub-btn\">\n                    <img src=\"images/svg/4.png\" alt=\"\" style=\"height: 38px\"> \u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                    <i class=\"fas fa-angle-right dropdown\"></i>\n                </a>\n                <div class=\"sub-menu\">\n                    <a href=\"stol_neutral.html\" class=\"sub-item\">\u0421\u0442\u043E\u043B\u044B \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</a>\n                    <a href=\"moika_neutral.html\" class=\"sub-item\">\u041C\u043E\u0439\u043A\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</a>\n                    <a href=\"stellazh_neutral.html\" class=\"sub-item\">\u0421\u0442\u0435\u043B\u043B\u0430\u0436\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</a>\n                    <a href=\"polka_neutral.html\" class=\"sub-item\">\u041F\u043E\u043B\u043A\u0438 \u0438 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043A\u0438</a>\n                    <a href=\"telezhka_neutral.html\" class=\"sub-item\">\u0422\u0435\u043B\u0435\u0436\u043A\u0438 \u0434\u043B\u044F \u043F\u0440\u043E\u0442\u0438\u0432\u043D\u0435\u0439</a>\n                    <a href=\"podves_neutral.html\" class=\"sub-item\">\u041F\u043E\u0434\u0432\u0435\u0441\u044B \u0434\u043B\u044F \u0442\u0443\u0448</a>\n                </div>\n            </div>\n            <div class=\"item\">\n                <a href=\"zont.html\">\n                    <img src=\"images/svg/5.svg\" alt=\"\"> \u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0437\u043E\u043D\u0442\u044B\n                </a>\n            </div>\n            <div class=\"item\">\n                <a class=\"sub-btn\">\n                    <img src=\"images/svg/6.svg\" alt=\"\"> \u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                    <i class=\"fas fa-angle-right dropdown\"></i>\n                </a>\n                <div class=\"sub-menu\">\n                    <a href=\"holod_shkaf.html\" class=\"sub-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0448\u043A\u0430\u0444\u044B</a>\n                    <a href=\"holod_stol.html\" class=\"sub-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u043E\u043B\u044B</a>\n                    <a href=\"moroz_lar.html\" class=\"sub-item\">\u041C\u043E\u0440\u043E\u0437\u0438\u043B\u044C\u043D\u044B\u0435 \u043B\u0430\u0440\u0438</a>\n                    <a href=\"holod_kondit.html\" class=\"sub-item\">\u041A\u043E\u043D\u0434\u0438\u0442\u0435\u0440\u0441\u043A\u0438\u0435 \u0432\u0438\u0442\u0440\u0438\u043D\u044B</a>\n                    <a href=\"holod_nastol.html\" class=\"sub-item\">\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0432\u0438\u0442\u0440\u0438\u043D\u044B</a>\n                    <a href=\"holod_camera.html\" class=\"sub-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u043A\u0430\u043C\u0435\u0440\u044B</a>\n                    <a href=\"holod_ustanovka.html\" class=\"sub-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438</a>\n                    <a href=\"https://icegroup.kz/products.html\" class=\"sub-item\">\u0414\u0440\u0443\u0433\u0438\u0435 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F</a>\n                </div>\n            </div>\n            <div class=\"item\">\n                <a class=\"sub-btn\">\n                    <img src=\"images/svg/7.svg\" alt=\"\"> \u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438\n                    <i class=\"fas fa-angle-right dropdown\"></i>\n                </a>\n                <div class=\"sub-menu\">\n                    <a href=\"gastronome.html\" class=\"sub-item\">\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</a>\n                    <a href=\"perforated.html\" class=\"sub-item\">\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438 \u043F\u0435\u0440\u0444\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435</a>\n                    <a href=\"shape.html\" class=\"sub-item\">\u0424\u043E\u0440\u043C\u044B \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</a>\n                </div>\n            </div>\n            <div class=\"item\">\n                <a href=\"mixer.html\">\n                    <img src=\"images/svg/8.svg\" alt=\"\"> \u041C\u0438\u043A\u0441\u0435\u0440\u044B, \u0431\u043B\u0435\u043D\u0434\u0435\u0440\u044B\n                </a>\n            </div>\n        </div>\n    </div>\n    ";
  header_container.after(main_nav); // __________________Номера в шапке (Алматы, Астана, Шымкент)________________________

  var select_ul_background = document.createElement("div");
  select_ul_background.classList.add("select_ul-background"); // black opacity background

  document.querySelector("body").appendChild(select_ul_background);

  if (window.innerWidth > 767) {
    $(".select_wrap").mouseover(function () {
      $(this).addClass("active");
    });
    $(".select_wrap").mouseout(function () {
      $(this).removeClass("active");
    });
    $(".select_wrap").click(function () {
      $(this).toggleClass("active");
    }); // $(".cat_menu_container").innerHTML = `
    // <a href="catalog.html">
    //     <div class="cat_menu_title d-flex flex-row align-items-center justify-content-start">
    //     <div class="cat_burger"><span></span><span></span><span></span></div>
    //     <div class="cat_menu_text">Товары</div>
    //     </div>;
    //     </a>`;
  } else {
    document.querySelector(".main_nav_content").appendChild(document.querySelector(".select_ul"));
    $(".select_wrap").click(function () {
      $(".select_ul").toggleClass("active");

      if ($(".select_ul").hasClass("active")) {
        $(".select_ul-background").addClass("active");
      } else {
        $(".select_ul-background").removeClass("active");
      }

      $(".side-bar").removeClass("active");
      $(".cat_menu_container").removeClass("active");
    }); // _______________________________________

    $(".cat_menu_container a").removeAttr("href");
    $(".sub-btn").click(function () {
      $(this).next(".sub-menu").slideToggle();
      $(this).find(".dropdown").toggleClass("rotate");
    });
    $(".cat_menu_container").click(function () {
      $(this).toggleClass("active");
      $(".side-bar").toggleClass("active");

      if ($(".side-bar").hasClass("active")) {
        $(".select_ul-background").addClass("active");
      } else {
        $(".select_ul-background").removeClass("active");
      }

      $(".select_ul").removeClass("active");
    });
    $(".select_ul-background").click(function () {
      $(".select_ul-background").removeClass("active");
      $(".cat_menu_container").removeClass("active");
      $(".select_ul").removeClass("active");
      $(".side-bar").removeClass("active");
    });
  } // _________________________________top menu active________________________________________


  var filename = window.location.href.split("/").pop().split("#")[0].split("?")[0];
  var loct;

  switch (filename) {
    case "":
    case "index.html":
      loct = 0;
      break;

    case "design.html":
      loct = 1;
      break;

    case "delivery.html":
      loct = 2;
      break;

    case "about.html":
      loct = 3;
      break;

    case "otzyvy.php":
      loct = 4;
      break;

    case "contact.html":
    case "almaty.html":
    case "astana.html":
    case "shymkent.html":
      loct = 5;
      break;

    default:
      //     document.querySelector(".cat_menu_container").classList.add("active")
      loct = 6; // document.querySelector(".cat_menu_container").classList.add("active");

      break;
  }

  if (document.querySelector(".main_nav_dropdown") != null && loct != 6) {
    var addActiveClass = function addActiveClass() {
      document.querySelector(".main_nav_dropdown").children[loct].classList.add("active");
    };

    addActiveClass();
  } // _________________________________________________________________________________________________________


  var footer = document.querySelector(".footer");
  footer.innerHTML = "\n    <div class=\"container footer_container\">\n            <div class=\"block one\">\n                <div class=\"block__item\">\n                    <div class=\"block__title\">\n                        <h5 class=\"trans-it\">\u041E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438</h5>\n                    </div>\n                    <div class=\"block__text\">\n                        <div class=\"footer-block1-first\">\n                            <ul>\n                                <li>\n                                    <a class=\"trans-it\" href=\"index.html\">\u0413\u043B\u0430\u0432\u043D\u0430\u044F</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"products.html\">\u041D\u0430\u0448\u0438 \u0442\u043E\u0432\u0430\u0440\u044B</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"design.html\">3D \u0414\u0438\u0437\u0430\u0439\u043D</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"delivery.html\">\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"about.html\">\u041E \u043D\u0430\u0441</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"otzyvy.php\">\u041E\u0442\u0437\u044B\u0432\u044B</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"contact.html\">\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B</a>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"block__item\">\n                    <div class=\"block__title\">\n                        <h5 class=\"trans-it\">\u0422\u043E\u0432\u0430\u0440\u044B</h5>\n                    </div>\n                    <div class=\"block__text\">\n                        <div class=\"footer-block1-second\">\n                            <ul>\n                                <li>\n                                    <a class=\"trans-it\" href=\"teplovoe.html\">\u0422\u0435\u043F\u043B\u043E\u0432\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"salat_bary.html\">\u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440\u044B</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"linii_razdachi.html\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"neutral.html\">\u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"zont.html\">\u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0437\u043E\u043D\u0442\u044B</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"holod.html\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u044F</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"container.html\">\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438</a>\n                                </li>\n                                <li>\n                                    <a class=\"trans-it\" href=\"mixer.html\">\u041C\u0438\u043A\u0441\u0435\u0440\u044B, \u0431\u043B\u0435\u043D\u0434\u0435\u0440\u044B</a>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"block__item block__item__ala\">\n                    <div class=\"block__title\">\n                        <h5 class=\"trans-it\">\u0433. \u0410\u043B\u043C\u0430\u0442\u044B</h5>\n                    </div>\n                    <div class=\"block__text\" style=\"padding-top: 20px;\">\n\n                        <div class=\"foot-one wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-ala\" style=\"width: 100%\">\n\n                                        <p><a class=\"almaty_info\" href=\"almaty.html\">\u0443\u043B. \u041C\u044B\u043D\u0431\u0430\u0435\u0432\u0430 43 (\u0443\u0433. \u0443\u043B. \u043C\u0435\u0436\u0434\u0443 \u0410\u0443\u0435\u0437\u043E\u0432\u0430\n                                                \u0438 \u041C\u0430\u043D\u0430\u0441\u0430) 050008\n                                            </a>\n                                        </p>\n\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-two wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-ala\" style=\"width: 100%\">\n                                        <p style=\"margin-bottom: 5px;\"><a href=\"tel:87273449900\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">8 (727) 344-99-00</a></p>\n                                        <p><a href=\"tel:87012667700\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">+7 (701) 266-77-00</a></p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-three wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-ala\" style=\"width: 100%\">\n                                        <p><a href=\"mailto:zakaz@idiamarket.kz\">zakaz@idiamarket.kz</a></p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"block__item block__item__nur\">\n                    <div class=\"block__title\">\n                        <h5 class=\"trans-it\">\u0433. \u0410\u0441\u0442\u0430\u043D\u0430</h5>\n                    </div>\n                    <div class=\"block__text\" style=\"padding-top: 20px;\">\n\n                        <div class=\"foot-one wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p><a class=\"almaty_info\" href=\"astana.html\">\u0443\u043B. \u0411\u0435\u0439\u0441\u0435\u043A\u0431\u0430\u0435\u0432\u0430 24/1, 2-\u044D\u0442\u0430\u0436 \u0431\u0438\u0437\u043D\u0435\u0441 \u0446\u0435\u043D\u0442\u0440 DARA.\n                                            </a>\n                                        </p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-two wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p style=\"margin-bottom: 5px;\"><a href=\"tel:87172279900\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">8 (7172) 27-99-00</a></p>\n                                        <p><a href=\"tel:87015112200\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">+7 (701) 511-22-00</a></p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-three wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p><a href=\"mailto:astana@idiamarket.kz\">astana@idiamarket.kz</a>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"block__item block__item__shym\">\n                    <div class=\"block__title\">\n                        <h5 class=\"trans-it\">\u0433. \u0428\u044B\u043C\u043A\u0435\u043D\u0442</h5>\n                    </div>\n                    <div class=\"block__text\" style=\"padding-top: 20px;\">\n\n                        <div class=\"foot-one wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p><a class=\"almaty_info\" href=\"shymkent.html\">\u0443\u043B. \u041C\u0430\u0434\u0435\u043B\u0438 \u043A\u043E\u0436\u0430 35/1, (\u0443\u0433.\u0443\u043B. \u0411\u0430\u0439\u0442\u0443\u0440\u0441\u044B\u043D\u043E\u0432\u0430) 1-\u044D\u0442\u0430\u0436, \u0431\u0438\u0437\u043D\u0435\u0441-\u0446\u0435\u043D\u0442\u0440 BNK\n                                            </a>\n                                        </p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-two wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p style=\"margin-bottom: 5px;\"><a href=\"tel:87252399900\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">8 (7252) 39-99-00</a></p>\n                                        <p><a href=\"tel:87019447700\" onclick=\"gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});\">+7 (701) 944 77 00</a></p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"foot-three wrappers\">\n                            <div class=\"foot-one-right\">\n                                <div class=\"row footer-address-grid-right\">\n                                    <div class=\"footer-city-asa\" style=\"width: 100%\">\n                                        <p><a href=\"mailto:shymkent@idiamarket.kz\">shymkent@idiamarket.kz</a>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n\n\n\n\n\n\n\n            <div class=\"footer-row\">\n\n                <div class=\"col_1\">\n                    <div class=\"footer_column footer_contact\">\n                        <div class=\"logo_container footer_logo_container\">\n                            <div class=\"logo\">\n                                <a href=\"index.html\"><img src=\"images/logo.png\"></a>\n                            </div>\n                        </div>\n\n                        <hr class=\"hr-footer first_change_hr\">\n\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87273449900\">8 (727) 344-99-00</a>\n                        </div>\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87012667700\">+7 (701) 266-77-00</a>\n                        </div>\n                        <div class=\"footer_contact_text\">\n                            <a href=\"almaty.html\">\n                                <p>\u0433. \u0410\u043B\u043C\u0430\u0442\u044B, \u0443\u043B. \u041C\u044B\u043D\u0431\u0430\u0435\u0432\u0430 43 (\u0443\u0433.\u0443\u043B. \u041C\u0430\u043D\u0430\u0441\u0430), 1-\u044D\u0442\u0430\u0436, 050008</p>\n                            </a>\n                            <p></p>\n                        </div>\n\n                        <hr class=\"hr-footer\">\n\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87172279900\">8 (7172) 27-99-00</a>\n                        </div>\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87015112200\">+7 (701) 511-22-00</a>\n                        </div>\n                        <div class=\"footer_contact_text\">\n                            <a href=\"astana.html\">\n                                <p>\u0433. \u0410\u0441\u0442\u0430\u043D\u0430, \u0443\u043B. \u0411\u0435\u0439\u0441\u0435\u043A\u0431\u0430\u0435\u0432\u0430 24/1, 2-\u044D\u0442\u0430\u0436 \u0431\u0438\u0437\u043D\u0435\u0441 \u0446\u0435\u043D\u0442\u0440 DARA</p>\n                            </a>\n                        </div>\n\n                        <hr class=\"hr-footer\">\n\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87252399900\">8 (7252) 39-99-00</a>\n                        </div>\n                        <div class=\"footer_phone\">\n                            <a href=\"tel:87019447700\">+7 (701) 944-77-00</a>\n                        </div>\n                        <div class=\"footer_contact_text\">\n                            <a href=\"shymkent.html\">\n                                <p>\u0433. \u0428\u044B\u043C\u043A\u0435\u043D\u0442, \u0443\u043B. \u041C\u0430\u0434\u0435\u043B\u0438 \u043A\u043E\u0436\u0430 35/1, (\u0443\u0433.\u0443\u043B. \u0411\u0430\u0439\u0442\u0443\u0440\u0441\u044B\u043D\u043E\u0432\u0430) 1-\u044D\u0442\u0430\u0436, \u0431\u0438\u0437\u043D\u0435\u0441-\u0446\u0435\u043D\u0442\u0440 BNK</p>\n                            </a>\n                        </div>\n\n                        <hr class=\"hr-footer first_change_hr\">\n\n                    </div>\n                </div>\n\n                <div class=\"main_links_container\">\n                    <div class=\"col_2\">\n                        <div class=\"footer_column\">\n                            <div class=\"footer_subtitle\"><a href=\"index.html\">\u0413\u043B\u0430\u0432\u043D\u0430\u044F</a></div>\n                            <ul class=\"footer_list\">\n\n\n                                <li><a href=\"design.html\">3D \u0414\u0438\u0437\u0430\u0439\u043D</a></li>\n                                <li><a href=\"delivery.html\">\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430</a></li>\n                                <li><a href=\"about.html\">\u041E \u043D\u0430\u0441</a></li>\n                                <li><a href=\"otzyvy.php\">\u041E\u0442\u0437\u044B\u0432\u044B</a></li>\n                                <li><a href=\"contact.html\">\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B</a></li>\n                            </ul>\n\n                        </div>\n                    </div>\n\n                    <div class=\"col_3\">\n\n                        <div class=\"footer_column\">\n                            <div class=\"footer_subtitle\"><a href=\"catalog.html\">\u041A\u0430\u0442\u0430\u043B\u043E\u0433</a></div>\n                            <ul class=\"footer_list\">\n\n                                <li><a href=\"teplovoe.html\">\u0422\u0435\u043F\u043B\u043E\u0432\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</a></li>\n                                <li><a href=\"salat_bary.html\">\u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440\u044B</a></li>\n                                <li><a href=\"linii_razdachi.html\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438</a></li>\n                                <li><a href=\"zont.html\">\u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0437\u043E\u043D\u0442\u044B</a></li>\n                                <li><a href=\"neutral.html\">\u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</a></li>\n                                <li><a href=\"holod.html\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</a></li>\n\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </div>\n            <p class=\"footer-prava\" style=\"text-align:center; margin-top:2em\">&copy 2010-2022 Horest</p>\n        </div>\n    ";
  var body = document.querySelector("body");
  var categories_menu_container = document.createElement("section");
  categories_menu_container.classList.add("categories-menu-container");
  categories_menu_container.innerHTML = "\n                <nav class=\"categories-menu\">\n                    <ul class=\"categories-menu-list\">\n                        <a class=\"categories-menu-link\" href=\"teplovoe.html\">\n\n                            <li id=\"10\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span> \u0422\u0435\u043F\u043B\u043E\u0432\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                                <ul id=\"10\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"plita.html\">\n                                        <li id=\"11\" class=\"sub-categories-menu-item\">\u041F\u043B\u0438\u0442\u044B \u044D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0435</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zhar.html\">\n                                        <li id=\"12\" class=\"sub-categories-menu-item\">\u0416\u0430\u0440\u043E\u0447\u043D\u044B\u0435 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"skovoroda.html\">\n                                        <li id=\"13\" class=\"sub-categories-menu-item\">\u0421\u043A\u043E\u0432\u043E\u0440\u043E\u0434\u044B \u044D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0435</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"fryer.html\">\n                                        <li id=\"14\" class=\"sub-categories-menu-item\">\u0424\u0440\u0438\u0442\u044E\u0440\u043D\u0438\u0446\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"poverhnost.html\">\n                                        <li id=\"15\" class=\"sub-categories-menu-item\">\u041F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 \u0440\u0430\u0431\u043E\u0447\u0438\u0435</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"marmit.html\">\n                                        <li id=\"16\" class=\"sub-categories-menu-item\">\u041C\u0430\u0440\u043C\u0438\u0442\u044B \u0432\u0442\u043E\u0440\u044B\u0445 \u0431\u043B\u044E\u0434</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"shkaf_zhar.html\">\n                                        <li id=\"17\" class=\"sub-categories-menu-item\">\u0416\u0430\u0440\u043E\u0447\u043D\u044B\u0435 \u0448\u043A\u0430\u0444\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"shkaf_proofing.html\">\n                                        <li id=\"18\" class=\"sub-categories-menu-item\">\u0428\u043A\u0430\u0444\u044B \u0440\u0430\u0441\u0441\u0442\u043E\u0435\u0447\u043D\u044B\u0435</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"salat_bary.html\">\n                            <li id=\"20\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span> \u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440\u044B\n                                <ul id=\"20\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"salatbar_neutral.html\">\n                                        <li id=\"21\" class=\"sub-categories-menu-item\">\u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440 \u043D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"salatbar_teplovoi.html\">\n                                        <li id=\"22\" class=\"sub-categories-menu-item\">\u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440 \u0442\u0435\u043F\u043B\u043E\u0432\u043E\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"salatbar_holod.html\">\n                                        <li id=\"23\" class=\"sub-categories-menu-item\">\u0421\u0430\u043B\u0430\u0442 \u0431\u0430\u0440 \u043E\u0445\u043B\u0430\u0436\u0434\u0430\u0435\u043C\u044B\u0439</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"linii_razdachi.html\">\n                            <li id=\"30\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438\n                                <ul id=\"30\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"vega.html\">\n                                        <li id=\"31\" class=\"sub-categories-menu-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u0412\u0435\u0433\u0430</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"master.html\">\n                                        <li id=\"32\" class=\"sub-categories-menu-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u041C\u0430\u0441\u0442\u0435\u0440</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"school.html\">\n                                        <li id=\"33\" class=\"sub-categories-menu-item\">\u041B\u0438\u043D\u0438\u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u0428\u043A\u043E\u043B\u044C\u043D\u0438\u043A</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"neutral.html\">\n                            <li id=\"40\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u041D\u0435\u0439\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                                <ul id=\"4\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"stol_neutral.html\">\n                                        <li id=\"41\" class=\"sub-categories-menu-item\">\u0421\u0442\u043E\u043B\u044B \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"moika_neutral.html\">\n                                        <li id=\"42\" class=\"sub-categories-menu-item\">\u041C\u043E\u0439\u043A\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"stellazh_neutral.html\">\n                                        <li id=\"43\" class=\"sub-categories-menu-item\">\u0421\u0442\u0435\u043B\u043B\u0430\u0436\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"polka_neutral.html\">\n                                        <li id=\"44\" class=\"sub-categories-menu-item\">\u041F\u043E\u043B\u043A\u0438 \u0438 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043A\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"telezhka_neutral.html\">\n                                        <li id=\"45\" class=\"sub-categories-menu-item\">\u0422\u0435\u043B\u0435\u0436\u043A\u0438 \u0434\u043B\u044F \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"podves_neutral.html\">\n                                        <li id=\"46\" class=\"sub-categories-menu-item\">\u041F\u043E\u0434\u0432\u0435\u0441\u044B \u0434\u043B\u044F \u0442\u0443\u0448</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"zont.html\">\n                            <li id=\"50\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0437\u043E\u043D\u0442\u044B\n                                <ul id=\"50\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"zont_vytyazhnoi.html\">\n                                        <li id=\"51\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043F\u0440\u0438\u0441\u0442\u0435\u043D\u043D\u044B\u0439 \u0432\u044B\u0442\u044F\u0436\u043D\u043E\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zont_pritochnyi.html\">\n                                        <li id=\"52\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043F\u0440\u0438\u0442\u043E\u0447\u043D\u043E-\u0432\u044B\u0442\u044F\u0436\u043D\u043E\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zont_nastennyi.html\">\n                                        <li id=\"53\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043D\u0430\u0441\u0442\u0435\u043D\u043D\u044B\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zont_ostrovnoi.html\">\n                                        <li id=\"54\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043E\u0441\u0442\u0440\u043E\u0432\u043D\u043E\u0439</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zont_type1.html\">\n                                        <li id=\"55\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043E\u0441\u0442\u0440\u043E\u0432\u043D\u043E\u0439 \u0442\u0438\u043F 1</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"zont_type2.html\">\n                                        <li id=\"56\" class=\"sub-categories-menu-item\">\u0417\u043E\u043D\u0442 \u0432\u0435\u043D\u0442\u0438\u043B\u044F\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043E\u0441\u0442\u0440\u043E\u0432\u043D\u043E\u0439 \u0442\u0438\u043F 2</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"holod.html\">\n                            <li id=\"60\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\n                                <ul id=\"60\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"holod_shkaf.html\">\n                                        <li id=\"61\" class=\"sub-categories-menu-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0448\u043A\u0430\u0444\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"holod_stol.html\">\n                                        <li id=\"62\" class=\"sub-categories-menu-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u043E\u043B\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"moroz_lar.html\">\n                                        <li id=\"63\" class=\"sub-categories-menu-item\">\u041C\u043E\u0440\u043E\u0437\u0438\u043B\u044C\u043D\u044B\u0435 \u043B\u0430\u0440\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"holod_kondit.html\">\n                                        <li id=\"64\" class=\"sub-categories-menu-item\">\u041A\u043E\u043D\u0434\u0438\u0442\u0435\u0440\u0441\u043A\u0438\u0435 \u0432\u0438\u0442\u0440\u0438\u043D\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"holod_nastol.html\">\n                                        <li id=\"65\" class=\"sub-categories-menu-item\">\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0432\u0438\u0442\u0440\u0438\u043D\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"holod_camera.html\">\n                                        <li id=\"66\" class=\"sub-categories-menu-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u043A\u0430\u043C\u0435\u0440\u044B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"holod_ustanovka.html\">\n                                        <li id=\"67\" class=\"sub-categories-menu-item\">\u0425\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"https://icegroup.kz/products.html\">\n                                        <li id=\"68\" class=\"sub-categories-menu-item\">\u0414\u0440\u0443\u0433\u0438\u0435 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u044B\u0435 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"container.html\">\n                            <li id=\"70\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438\n                                <ul id=\"70\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"gastronome.html\">\n                                        <li id=\"71\" class=\"sub-categories-menu-item\">\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438 \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"perforated.html\">\n                                        <li id=\"72\" class=\"sub-categories-menu-item\">\u0413\u0430\u0441\u0442\u0440\u043E\u0435\u043C\u043A\u043E\u0441\u0442\u0438 \u043F\u0435\u0440\u0444\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"shape.html\">\n                                        <li id=\"73\" class=\"sub-categories-menu-item\">\u0424\u043E\u0440\u043C\u044B \u0438\u0437 \u043D\u0435\u0440\u0436\u0430\u0432\u0435\u0439\u043A\u0438</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                        <a class=\"categories-menu-link\" href=\"mixer.html\">\n                            <li id=\"80\" class=\"categories-menu-item\">\n                                <span class=\"dots red-c\">.</span>\u041C\u0438\u043A\u0441\u0435\u0440\u044B, \u0431\u043B\u0435\u043D\u0434\u0435\u0440\u044B\n                                <ul id=\"80\" class=\"categories-menu-list-displaynone\">\n                                    <a class=\"categories-menu-link\" href=\"mixer_7.html\">\n                                        <li id=\"81\" class=\"sub-categories-menu-item\">\u041C\u0438\u043A\u0441\u0435\u0440 \u043F\u043B\u0430\u043D\u0435\u0442\u0430\u0440\u043D\u044B\u0439 B7 \u043B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"mixer_15.html\">\n                                        <li id=\"82\" class=\"sub-categories-menu-item\">\u041C\u0438\u043A\u0441\u0435\u0440 \u043F\u043B\u0430\u043D\u0435\u0442\u0430\u0440\u043D\u044B\u0439 B15 \u043B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"dough_mixer.html\">\n                                        <li id=\"83\" class=\"sub-categories-menu-item\">\u0422\u0435\u0441\u0442\u043E\u043C\u0435\u0441 HS20 \u043B</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"slicer.html\">\n                                        <li id=\"84\" class=\"sub-categories-menu-item\">\u0421\u043B\u0430\u0439\u0441\u0435\u0440 250ES-10</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"blender.html\">\n                                        <li id=\"85\" class=\"sub-categories-menu-item\">\u0411\u043B\u0435\u043D\u0434\u0435\u0440 CB-767</li>\n                                    </a>\n                                    <a class=\"categories-menu-link\" href=\"boiler.html\">\n                                        <li id=\"86\" class=\"sub-categories-menu-item\">\u041A\u0438\u043F\u044F\u0442\u0438\u043B\u044C\u043D\u0438\u043A WB</li>\n                                    </a>\n                                </ul>\n                            </li>\n                        </a>\n                    </ul>\n                </nav>\n                <div class=\"categories-menu-details\">\n                    <div class=\"categories-menu-detail-img-active\">\n                        <div class=\"sub-img-active\">\n                            <img id=\"\" src=\"\" alt=\"\">\n                        </div>\n                        <div class=\"category-images-display-none\">\n\n                            <img id=\"10\" src=\"images/products/1.png\" alt=\"\">\n                            <img id=\"11\" src=\"images/products/plita/6.jpg\" alt=\"\">\n                            <img id=\"12\" src=\"images/products/zhar/4.jpg\" alt=\"\">\n                            <img id=\"13\" src=\"images/products/skovoroda/1.jpg\" alt=\"\">\n                            <img id=\"14\" src=\"images/products/fryer/4.jpg\" alt=\"\">\n                            <img id=\"15\" src=\"images/products/poverh/2.jpeg\" alt=\"\">\n                            <img id=\"16\" src=\"images/products/marmit/3.jpg\" alt=\"\">\n                            <img id=\"17\" src=\"images/products/shkaf/1.jpg\" alt=\"\">\n                            <img id=\"18\" src=\"images/products/proofing/1.jpg\" alt=\"\">\n\n                            <img id=\"20\" src=\"images/products/2.png\" alt=\"\">\n                            <img id=\"21\" src=\"images/products/salatbar/2.jpg\" alt=\"\">\n                            <img id=\"22\" src=\"images/products/salatbar/1.jpg\" alt=\"\">\n                            <img id=\"23\" src=\"images/products/salatbar/3.jpg\" alt=\"\">\n\n                            <img id=\"30\" src=\"images/products/3.png\" alt=\"\">\n                            <img id=\"31\" src=\"images/products/linii/products/2.jpg\" alt=\"\">\n                            <img id=\"32\" src=\"images/products/linii/products/14.jpg\" alt=\"\">\n                            <img id=\"33\" src=\"images/products/linii/products/32.jpg\" alt=\"\">\n\n                            <img id=\"40\" src=\"images/products/4.png\" alt=\"\">\n                            <img id=\"41\" src=\"images/products/neutral/stol/main/1.jpg\" alt=\"\">\n                            <img id=\"42\" src=\"images/products/neutral/moika/main/7.jpg\" alt=\"\">\n                            <img id=\"43\" src=\"images/products/neutral/stellazh/main/4.jpg\" alt=\"\">\n                            <img id=\"44\" src=\"images/products/neutral/podstavka/main/4.jpg\" alt=\"\">\n                            <img id=\"45\" src=\"images/products/neutral/telezhka/main/1.jpg\" alt=\"\">\n                            <img id=\"46\" src=\"images/products/neutral/podvec/main/2.jpg\" alt=\"\">\n\n                            <img id=\"50\" src=\"images/products/6.png\" alt=\"\">\n                            <img id=\"51\" src=\"images/products/zont/2.jpg\" alt=\"\">\n                            <img id=\"52\" src=\"images/products/zont/1.jpg\" alt=\"\">\n                            <img id=\"53\" src=\"images/products/zont/4.jpg\" alt=\"\">\n                            <img id=\"54\" src=\"images/products/zont/6.jpg\" alt=\"\">\n                            <img id=\"55\" src=\"images/products/zont/3.jpg\" alt=\"\">\n                            <img id=\"56\" src=\"images/products/zont/5.jpg\" alt=\"\">\n\n                            <img id=\"60\" src=\"images/products/5.png\" alt=\"\">\n                            <img id=\"61\" src=\"images/products/holod/shkaf/27.png\" alt=\"\">\n                            <img id=\"62\" src=\"images/products/holod/stol/3.jpg\" alt=\"\">\n                            <img id=\"63\" src=\"images/products/holod/lar/2.jpg\" alt=\"\">\n                            <img id=\"64\" src=\"images/products/holod/kondit/main/5.png\" alt=\"\">\n                            <img id=\"65\" src=\"images/products/holod/nastol/main/4.jpg\" alt=\"\">\n                            <img id=\"66\" src=\"images/products/holod/camera/main/4.jpg\" alt=\"\">\n                            <img id=\"67\" src=\"images/products/holod/machine/main/6.jpg\" alt=\"\">\n                            <img id=\"68\" src=\"images/products/5.png\" alt=\"\">\n\n                            <img id=\"70\" src=\"images/products/7.png\" alt=\"\">\n                            <img id=\"71\" src=\"images/products/container/4.png\" alt=\"\">\n                            <img id=\"72\" src=\"images/products/container/7.png\" alt=\"\">\n                            <img id=\"73\" src=\"images/products/container/11.png\" alt=\"\">\n\n                            <img id=\"80\" src=\"images/products/9.png\" alt=\"\">\n                            <img id=\"81\" src=\"images/products/mixer/1.jpg\" alt=\"\">\n                            <img id=\"82\" src=\"images/products/mixer/2.jpg\" alt=\"\">\n                            <img id=\"83\" src=\"images/products/mixer/3.jpg\" alt=\"\">\n                            <img id=\"84\" src=\"images/products/mixer/4.jpg\" alt=\"\">\n                            <img id=\"85\" src=\"images/products/mixer/5.jpg\" alt=\"\">\n                            <img id=\"86\" src=\"images/products/mixer/6.png\" alt=\"\">\n                        </div>\n                    </div>\n                </div>\n         ";
  body.appendChild(categories_menu_container); // ___________________________________catalog category hover active_________________________________________

  var cat_menu_container = document.querySelector(".cat_menu_container");
  var cat_menu_container_li = document.querySelectorAll(".categories-menu-item");
  var cat_menu_container_li_sub = document.querySelectorAll(".sub-categories-menu-item");
  var categories_menu_container1 = document.querySelector(".categories-menu-container");
  var categories_menu_detail_active = document.querySelector(".categories-menu-detail-active");
  var mainImageCat = document.querySelector(".sub-img-active img");
  var ImageCat = document.querySelectorAll(".category-images-display-none img");

  if (categories_menu_container1 != null) {
    // cat_menu_container.addEventListener("mouseover", function() {
    //     categories_menu_container1.classList.add('displaying')
    // })
    categories_menu_container1.addEventListener("mouseleave", function () {
      categories_menu_container1.classList.remove("displaying");
    });
    cat_menu_container_li.forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        a.classList.add("active");
        ImageCat.forEach(function (image) {
          if (a.id == image.id) {
            mainImageCat.setAttribute("src", image.getAttribute("src"));
          }
        });
      });
      a.addEventListener("mouseleave", function () {
        a.classList.remove("active");
      });
    });
  } // _____________________________________________


  cat_menu_container_li_sub.forEach(function (b) {
    b.addEventListener("mouseover", function () {
      b.classList.add("active");
      ImageCat.forEach(function (image_sub) {
        if (b.id == image_sub.id) {
          mainImageCat.setAttribute("src", image_sub.getAttribute("src"));
        }
      });
    });
    b.addEventListener("mouseleave", function () {
      b.classList.remove("active");
    });
  }); // ______________________________________________________________________________________________________________

  $(".carosel").slick((_$$slick = {
    infinite: true,
    autoplay: true,
    autoplaySpeed: 1500,
    // this value should < total # of slides, otherwise the carousel won't slide at all
    slidesToShow: 4,
    slidesToScroll: 1,
    speed: 1000
  }, _defineProperty(_$$slick, "autoplay", true), _defineProperty(_$$slick, "dots", true), _defineProperty(_$$slick, "arrows", true), _defineProperty(_$$slick, "prevArrow", $(".carosel-nav-left")), _defineProperty(_$$slick, "nextArrow", $(".carosel-nav-right")), _$$slick));
}); // _________________________________________Каталог_____________________________________________________________
// select all accordion items

var accItems = document.querySelectorAll(".accordion__item"); // add a click event for all items

accItems.forEach(function (acc) {
  return acc.addEventListener("click", toggleAcc);
});

function toggleAcc() {
  var _this = this;

  // remove active class from all items exept the current item (this)
  accItems.forEach(function (item) {
    return item != _this ? item.classList.remove("accordion__item--active") : null;
  }); // toggle active class on current item

  if (this.classList != "accordion__item--active") {
    this.classList.toggle("accordion__item--active");
  }
} // ___________________________________Footer spoiler_________________________________________


$(document).ready(function () {
  $(".block__title").click(function (event) {
    if ($(".block").hasClass("one")) {
      $(".block__title").not($(this)).removeClass("active");
      $(".block__text").not($(this).next()).slideUp(300);
    }

    $(this).toggleClass("active").next().slideToggle(300);
  });
}); // ___________________________________Burger Menu__________________________________________

$(document).ready(function () {
  $(".nav-button").click(function () {
    $("body").toggleClass("nav-open");
  });
}); // ____________________Slick.js______________________

if (document.querySelector("#office_info_img") != null) {
  $("#office_info_img").slick({
    dots: true,
    infinite: true,
    speed: 500,
    fade: true,
    autoplay: true,
    autoplaySpeed: 8000,
    cssEase: "linear"
  });
}

$(".products_of_the_day_child").slick({
  dots: true,
  slidesToShow: 2,
  slidesToScroll: 1,
  autoplay: false,
  autoplaySpeed: 2000
}); // __________________Типы предприятия слайдер index.html________________________

if (document.querySelector("#flexiselDemo4") != null) {
  var _$$slick2;

  $("#flexiselDemo4").slick((_$$slick2 = {
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [{
      breakpoint: 992,
      settings: {
        slidesToShow: 4
      }
    }]
  }, _defineProperty(_$$slick2, "responsive", [{
    breakpoint: 800,
    settings: {
      slidesToShow: 3
    }
  }]), _defineProperty(_$$slick2, "responsive", [{
    breakpoint: 600,
    settings: {
      slidesToShow: 2
    }
  }]), _$$slick2));
} // ______________________________________________________________________________________________________________


(function () {
  var expand;

  expand = function expand() {
    var $input, $search;
    $search = $(".search");
    $input = $(".input");

    if ($search.hasClass("close")) {
      $search.removeClass("close");
      $input.removeClass("square");
    } else {
      $search.addClass("close");
      $input.addClass("square");
    }

    if ($search.hasClass("close")) {
      $input.focus();
    } else {
      $input.blur();
    }
  };

  $(function () {
    var $accordion, $wideScreen;
    $accordion = $("#accordion").children("li");
    $wideScreen = $(window).width() > 767;

    if ($wideScreen) {
      $accordion.on("mouseenter click", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    } else {
      $accordion.on("touchstart touchend", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    }
  });
  $(function () {
    var $accordion, $wideScreen;
    $accordion = $("#accordion2").children("li");
    $wideScreen = $(window).width() > 767;

    if ($wideScreen) {
      $accordion.on("mouseenter click", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    } else {
      $accordion.on("touchstart touchend", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    }
  });
  $(function () {
    var $accordion, $wideScreen;
    $accordion = $("#accordion3").children("li");
    $wideScreen = $(window).width() > 767;

    if ($wideScreen) {
      $accordion.on("mouseenter click", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    } else {
      $accordion.on("touchstart touchend", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    }
  });
  $(function () {
    var $accordion, $wideScreen;
    $accordion = $("#accordion4").children("li");
    $wideScreen = $(window).width() > 767;

    if ($wideScreen) {
      $accordion.on("mouseenter click", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    } else {
      $accordion.on("touchstart touchend", function (e) {
        var $this;
        e.stopPropagation();
        $this = $(this);

        if ($this.hasClass("out")) {
          $this.addClass("out");
        } else {
          $this.addClass("out");
          $this.siblings().removeClass("out");
        }
      });
    }
  });
  $(function () {
    var $container, $menu, $menubtn, $navbar;
    $menubtn = $("#hb");
    $navbar = $(".navbar");
    $menu = $(".navigation");
    $container = $(".site-inner");
    $menubtn.on("click", function (e) {
      if ($menubtn.hasClass("active")) {
        $menubtn.removeClass("active");
        $menu.removeClass("slide-right");
        $container.removeClass("slide-right");
        $navbar.removeClass("slide-right");
      } else {
        $menubtn.addClass("active");
        $menu.addClass("slide-right");
        $container.addClass("slide-right");
        $navbar.addClass("slide-right");
      }
    });
  });
  $(function () {
    var $button, clickOrTouch;
    clickOrTouch = "click touchstart";
    $button = $("#search-button");
    $button.on(clickOrTouch, expand);
  });
  $(function () {
    var $box;
    $box = $(".sm-box");
    $box.on("click", function (e) {
      e.preventDefault();
      var $this;
      $this = $(this);

      if ($this.hasClass("active")) {
        $this.removeClass("active");
      } else {
        $this.addClass("active");
      }
    });
  });
}).call(void 0);
$("select").each(function () {
  var $this = $(this),
      $options = $(this).children("option").length;
  $this.addClass("select-hidden");
  $this.wrap("<div class='select'></div>");
  $this.after("<div class='select-styled'></div>");
  var $styledSelect = $this.next("div.select-styled");
  $styledSelect.text($this.children("option").eq(0).text());
  var $list = $("<ul />", {
    "class": "select-options"
  }).insertAfter($styledSelect);

  for (var i = 0; i < $options; i++) {
    $("<li />", {
      text: $this.children("option").eq(i).text(),
      rel: $this.children("option").eq(i).val()
    }).appendTo($list);
  }

  var $listItems = $list.children("li");
  $styledSelect.on("click", function (e) {
    e.stopPropagation();
    $("div.select-styled.active").each(function () {
      $(this).removeClass("active").next("ul.select-options").hide();
    });
    $(this).toggleClass("active").next("ul.select-options").toggle();
  });
  $listItems.on("click", function (e) {
    e.stopPropagation();
    $styledSelect.text($(this).text()).removeClass("active");
    $this.val($(this).attr("rel"));
    $list.hide();
  });
  $(document).on("click", function () {
    $styledSelect.removeClass("active");
    $list.hide();
  });
  $(".select-sibling").next(".select-styled").css({
    "border-top": "0px"
  });
});
(function () {
  var $addItem = $("#add-item");
  var $badge = $(".badge");
  var $count = 1;
  $addItem.on("click", function (e) {
    e.preventDefault();
    $badge.html($count++);
  });
}).call(void 0); // ________________________Design page (height of fixed section)_________________________

$(function () {
  $(".about__block1__welcome, .about__block1__img1, .scroll-container").css({
    height: $(window).innerHeight() - $(".super_container").height()
  });
  $(window).resize(function () {
    $(".about__block1__welcome, .about__block1__img1, .scroll-container").css({
      height: $(window).innerHeight() - $(".super_container").height()
    });
  });
}); // ________________________About page (height of fixed section)_________________________

$(function () {
  $(".about_section_not1").css({
    height: $(window).innerHeight()
  });
  $(window).resize(function () {
    $(".about_section_not1").css({
      height: $(window).innerHeight()
    });
  });
}); // ___________image fixed don not work in the iOS mobile_____________

var about__block1__img__main = document.querySelector(".about__block1__img__main");

if (window.matchMedia("(max-width: 767px)").matches) {
  if (about__block1__img__main != null) {
    document.querySelector(".about__block1__img__main").style.background = "linear-gradient(rgba(0, 0, 0, 0.497), rgba(0, 0, 0, 0.497)), url('/images/delivery/4.webp') no-repeat center / cover";
    document.querySelector(".delivery__block3__child").style.background = "linear-gradient(rgba(0, 0, 0, 0.597), rgba(0, 0, 0, 0.597)), url('/images/delivery/7.webp') no-repeat center / cover";
    document.querySelector(".delivery__block5 .delivery__block3__child").style.background = "linear-gradient(rgba(0, 0, 0, 0.597), rgba(0, 0, 0, 0.597)), url('/images/delivery/9.webp') no-repeat bottom / cover";
  }

  if (document.querySelector(".scroll-container") != null) {
    document.querySelector(".about_section2").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/2.webp') no-repeat center / cover";
    document.querySelector(".about_section3").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/3.webp') no-repeat center / cover";
    document.querySelector(".about_section4").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/6.webp') no-repeat center / cover";
    document.querySelector(".about_section2").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/2.webp') no-repeat center / cover";
    document.querySelector(".about_section5").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/1.webp') no-repeat center / cover";
    document.querySelector(".about_section6").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/3.jpg') no-repeat center / cover"; // document.querySelector(".about_section7").style.background =
    // "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/home/4.webp') no-repeat center / cover";

    document.querySelector(".about_section8").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/2.webp') no-repeat center / cover";
    document.querySelector(".about_section9").style.background = "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/4.webp') no-repeat center / cover";
  }
} // _________________________________________________________________________________________________________


$(".design-project-slider").slick({
  slidesToShow: 2,
  slidesToScroll: 2,
  autoplay: true,
  autoplaySpeed: 3000,
  dots: true,
  responsive: [{
    breakpoint: 767,
    settings: {
      slidesToShow: 1,
      slidesToScroll: 1
    }
  }]
});
$(".blago_container_slider").slick({
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: false,
  autoplaySpeed: 3000,
  dots: true,
  responsive: [{
    breakpoint: 767,
    settings: {
      slidesToShow: 1,
      slidesToScroll: 1
    }
  }]
}); // new fullScroll({
//     // parent container
//     container: "main",
//     // content section
//     sections: "section",
//     // animation speed
//     animateTime: 0.7,
//     // easing for animation
//     animateFunction: "ease",
//     // current position
//     currentPosition: 0,
//     // display dots navigation
//     displayDots: true,
//     // where to place the dots navigation
//     dotsPosition: "left",
// });
// _____________________________________________

document.body.onload = function () {
  setTimeout(function () {
    var preloader = document.getElementById("page-preloader");

    if (!preloader.classList.contains("done")) {
      preloader.classList.add("done");
    }
  }, 800);
};