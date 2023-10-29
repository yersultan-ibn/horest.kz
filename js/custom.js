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

      $(this).animate({ width: placeholder.width() + "px" });
    });
  }

  /* 

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          4. Init Page Menu

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

  function initPageMenu() {
    if ($(".page_menu").length && $(".page_menu_content").length) {
      var menu = $(".page_menu");
      var menuContent = $(".page_menu_content");
      var menuTrigger = $(".menu_trigger");

      //Open / close page menu
      menuTrigger.on("click", function () {
        if (!menuActive) {
          openMenu();
        } else {
          closeMenu();
        }
      });

      //Handle page menu
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
                TweenMax.to(subItem, 0.3, { height: 0 });
              } else {
                subItem.toggleClass("active");
                TweenMax.set(subItem, { height: "auto" });
                TweenMax.from(subItem, 0.3, { height: 0 });
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
    TweenMax.set(menuContent, { height: "auto" });
    TweenMax.from(menuContent, 0.3, { height: 0 });
    menuActive = true;
  }

  function closeMenu() {
    var menu = $(".page_menu");
    var menuContent = $(".page_menu_content");
    TweenMax.to(menuContent, 0.3, { height: 0 });
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
        autoplayTimeout: 5000,
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
        tabsLine.css({ left: posX, width: $(tabGroup[0]).width() });
        tabGroup.each(function () {
          var tab = $(this);
          tab.on("click", function () {
            if (!tab.hasClass("active")) {
              tabGroup.removeClass("active");
              tab.toggleClass("active");
              var tabXPos = tab.position().left;
              var tabWidth = tab.width();
              tabsLine.css({ left: tabXPos, width: tabWidth });
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
              var slider = $(this);
              // slider.slick("unslick");
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
    featuredSlider
      .on("init", function () {
        var activeItems = featuredSlider.find(".slick-slide.slick-active");
        for (var x = 0; x < activeItems.length - 1; x++) {
          var item = $(activeItems[x]);
          item.find(".border_active").removeClass("active");
          if (item.hasClass("slick-active")) {
            item.find(".border_active").addClass("active");
          }
        }
      })
      .on({
        afterChange: function (
          event,
          slick,
          current_slide_index,
          next_slide_index
        ) {
          var activeItems = featuredSlider.find(".slick-slide.slick-active");
          activeItems.find(".border_active").removeClass("active");
          for (var x = 0; x < activeItems.length - 1; x++) {
            var item = $(activeItems[x]);
            item.find(".border_active").removeClass("active");
            if (item.hasClass("slick-active")) {
              item.find(".border_active").addClass("active");
            }
          }
        },
      });
    // .slick({
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
          0: { items: 1 },
          575: { items: 2 },
          640: { items: 3 },
          768: { items: 4 },
          991: { items: 5 },
        },
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
        smartSpeed: 1200,
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
    arrivalsSlider
      .on("init", function () {
        var activeItems = arrivalsSlider.find(".slick-slide.slick-active");
        for (var x = 0; x < activeItems.length - 1; x++) {
          var item = $(activeItems[x]);
          item.find(".border_active").removeClass("active");
          if (item.hasClass("slick-active")) {
            item.find(".border_active").addClass("active");
          }
        }
      })
      .on({
        afterChange: function (
          event,
          slick,
          current_slide_index,
          next_slide_index
        ) {
          var activeItems = arrivalsSlider.find(".slick-slide.slick-active");
          activeItems.find(".border_active").removeClass("active");
          for (var x = 0; x < activeItems.length - 1; x++) {
            var item = $(activeItems[x]);
            item.find(".border_active").removeClass("active");
            if (item.hasClass("slick-active")) {
              item.find(".border_active").addClass("active");
            }
          }
        },
      })
      .slick({
        rows: 2,
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: false,
        arrows: false,
        dots: true,
        responsive: [
          {
            breakpoint: 768,
            settings: {
              rows: 2,
              slidesToShow: 3,
              slidesToScroll: 3,
              dots: true,
            },
          },
          {
            breakpoint: 575,
            settings: {
              rows: 2,
              slidesToShow: 2,
              slidesToScroll: 2,
              dots: false,
            },
          },
          {
            breakpoint: 480,
            settings: {
              rows: 1,
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: false,
            },
          },
        ],
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
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            rows: 2,
            slidesToShow: 2,
            slidesToScroll: 2,
            dots: true,
          },
        },
        {
          breakpoint: 991,
          settings: {
            rows: 2,
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
          },
        },
        {
          breakpoint: 575,
          settings: {
            rows: 1,
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: false,
          },
        },
      ],
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
          0: { items: 1 },
          575: { items: 2 },
          991: { items: 3 },
        },
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
          0: { items: 1 },
          768: { items: 2 },
          991: { items: 3 },
        },
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
          0: { items: 2 },
          575: { items: 2 },
          767: { items: 3 },
          900: { items: 4 },
          1000: { items: 4 },
          1250: { items: 5 },
        },
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
        margin: 42,
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
        var target_date;

        // Add a date to data-target-time of the .deals_timer_box
        // Format: "Feb 17, 2018"
        if (timer.data("target-time") !== "") {
          targetTime = timer.data("target-time");
          target_date = new Date(targetTime).getTime();
        } else {
          var date = new Date();
          date.setDate(date.getDate() + 2);
          target_date = date.getTime();
        }

        // variables for time units
        var days, hours, minutes, seconds;

        var h = timer.find(".deals_timer_hr");
        var m = timer.find(".deals_timer_min");
        var s = timer.find(".deals_timer_sec");

        setInterval(function () {
          // find the amount of "seconds" between now and target
          var current_date = new Date().getTime();
          var seconds_left = (target_date - current_date) / 1000;
          console.log(seconds_left);

          // do some time calculations
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
          }

          // display results
          h.text(hours);
          m.text(minutes);
          s.text(seconds);
        }, 1000);
      });
    }
  }

  // _________________________________Header dinamic view into the smart-search.js______________________________________

  // input logic

  const inputActiveOnTyping = document.querySelector(".super-input");
  const hoverActive = document.querySelector(".search-input-box");

  inputActiveOnTyping.addEventListener("input", ({ target }) => {
    if (target.value.trim()) {
      hoverActive.classList.add("active");
    } else {
      hoverActive.classList.remove("active");
    }
  });

  // _______________________________go back buttom will not work in this main page_________________________________

  let page_title = window.location.href
    .split("/")
    .pop()
    .split("#")[0]
    .split("?")[0];

  let go_back = document.querySelector(".go_back");

  if (
    page_title == "index.html" ||
    page_title == "products.html" ||
    page_title == "design.html" ||
    page_title == "delivery.html" ||
    page_title == "about.html" ||
    page_title == "otzyvy.php" ||
    page_title == "contact.html"
  ) {
    go_back.style.display = "none";
  }

  // ____________________________________Vertical popup menu_________________________________

  let main_nav = document.createElement("nav");
  main_nav.innerHTML = `
    <div class="side-bar">
        <div class="menu">
            <div class="item">
                <a class="sub-btn">
                    <img src="images/svg/1.svg" alt=""> Тепловое оборудование
                    <i class="fas fa-angle-right dropdown"></i>
                </a>
                <div class="sub-menu">
                    <a href="plita.html" class="sub-item">Плиты электрические</a>
                    <a href="zhar.html" class="sub-item">Жарочные поверхности</a>
                    <a href="skovoroda.html" class="sub-item">Сковороды электрические</a>
                    <a href="fryer.html" class="sub-item">Фритюрницы</a>
                    <a href="poverhnost.html" class="sub-item">Поверхности рабочие</a>
                    <a href="marmit.html" class="sub-item">Мармиты вторых блюд</a>
                    <a href="shkaf_zhar.html" class="sub-item">Жарочные шкафы</a>
                    <a href="shkaf_proofing.html" class="sub-item">Шкафы расстоечные</a>
                </div>
            </div>
            <div class="item">
                <a href="salat_bary.html">
                    <img src="images/svg/3.svg" alt=""> Салат бары
                </a>
            </div>
            <div class="item">
                <a class="sub-btn">
                    <img src="images/svg/2.svg" alt=""> Линии раздачи
                    <i class="fas fa-angle-right dropdown"></i>
                </a>
                <div class="sub-menu">
                    <a href="vega.html" class="sub-item">Линии раздачи ВЕГА</a>
                    <a href="master.html" class="sub-item">Линии раздачи Мастер</a>
                    <a href="school.html" class="sub-item">Линии раздачи Школьник</a>
                </div>
            </div>
            <div class="item">
                <a class="sub-btn">
                    <img src="images/svg/4.png" alt="" style="height: 38px"> Нейтральное оборудование
                    <i class="fas fa-angle-right dropdown"></i>
                </a>
                <div class="sub-menu">
                    <a href="stol_neutral.html" class="sub-item">Столы из нержавейки</a>
                    <a href="moika_neutral.html" class="sub-item">Мойки из нержавейки</a>
                    <a href="stellazh_neutral.html" class="sub-item">Стеллажи из нержавейки</a>
                    <a href="polka_neutral.html" class="sub-item">Полки и подставки</a>
                    <a href="telezhka_neutral.html" class="sub-item">Тележки для противней</a>
                    <a href="podves_neutral.html" class="sub-item">Подвесы для туш</a>
                </div>
            </div>
            <div class="item">
                <a href="zont.html">
                    <img src="images/svg/5.svg" alt=""> Вентиляционные зонты
                </a>
            </div>
            <div class="item">
                <a class="sub-btn">
                    <img src="images/svg/6.svg" alt=""> Холодильное оборудование
                    <i class="fas fa-angle-right dropdown"></i>
                </a>
                <div class="sub-menu">
                    <a href="holod_shkaf.html" class="sub-item">Холодильные шкафы</a>
                    <a href="holod_stol.html" class="sub-item">Холодильные столы</a>
                    <a href="moroz_lar.html" class="sub-item">Морозильные лари</a>
                    <a href="holod_kondit.html" class="sub-item">Кондитерские витрины</a>
                    <a href="holod_nastol.html" class="sub-item">Настольные витрины</a>
                    <a href="holod_camera.html" class="sub-item">Холодильные камеры</a>
                    <a href="holod_ustanovka.html" class="sub-item">Холодильные установки</a>
                    <a href="https://icegroup.kz/products.html" class="sub-item">Другие холодильные оборудования</a>
                </div>
            </div>
            <div class="item">
                <a class="sub-btn">
                    <img src="images/svg/7.svg" alt=""> Гастроемкости
                    <i class="fas fa-angle-right dropdown"></i>
                </a>
                <div class="sub-menu">
                    <a href="gastronome.html" class="sub-item">Гастроемкости из нержавейки</a>
                    <a href="perforated.html" class="sub-item">Гастроемкости перфорированные</a>
                    <a href="shape.html" class="sub-item">Формы из нержавейки</a>
                </div>
            </div>
            <div class="item">
                <a href="mixer.html">
                    <img src="images/svg/8.svg" alt=""> Электромеханическое оборудование
                </a>
            </div>
        </div>
    </div>
    `;

  header_container.after(main_nav);

  // __________________Номера в шапке (Алматы, Астана, Шымкент)________________________

  let select_ul_background = document.createElement("div");
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
    });

    // $(".cat_menu_container").innerHTML = `
    // <a href="catalog.html">
    //     <div class="cat_menu_title d-flex flex-row align-items-center justify-content-start">
    //     <div class="cat_burger"><span></span><span></span><span></span></div>
    //     <div class="cat_menu_text">Товары</div>
    //     </div>;
    //     </a>`;
  } else {
    document
      .querySelector(".main_nav_content")
      .appendChild(document.querySelector(".select_ul"));

    $(".select_wrap").click(function () {
      $(".select_ul").toggleClass("active");

      if ($(".select_ul").hasClass("active")) {
        $(".select_ul-background").addClass("active");
      } else {
        $(".select_ul-background").removeClass("active");
      }
      $(".side-bar").removeClass("active");
      $(".cat_menu_container").removeClass("active");
    });

    // _______________________________________

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

    $(".select_ul-background").click(() => {
      $(".select_ul-background").removeClass("active");
      $(".cat_menu_container").removeClass("active");
      $(".select_ul").removeClass("active");
      $(".side-bar").removeClass("active");
    });
  }

  // _________________________________top menu active________________________________________

  let filename = window.location.href
    .split("/")
    .pop()
    .split("#")[0]
    .split("?")[0];

  let loct;
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
      loct = 6;
      // document.querySelector(".cat_menu_container").classList.add("active");
      break;
  }

  if (document.querySelector(".main_nav_dropdown") != null && loct != 6) {
    function addActiveClass() {
      document
        .querySelector(".main_nav_dropdown")
        .children[loct].classList.add("active");
    }
    addActiveClass();
  }
  // _________________________________________________________________________________________________________

  const head = document.querySelector("head");
  head.innerHTML += `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.1/css/all.css">`;

  const footer = document.querySelector(".footer");
  footer.innerHTML = `
  <div class="container footer_container">
                <div class="block one">
                    <div class="block__item">
                        <div class="block__title">
                            <h5 class="trans-it">О компании</h5>
                        </div>
                        <div class="block__text">
                            <div class="footer-block1-first">
                                <ul>
                                    <li>
                                        <a class="trans-it" href="index.html">Главная</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="products.html">Наши товары</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="design.html">3D Дизайн</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="delivery.html">Доставка</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="about.html">О нас</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="otzyvy.php">Отзывы</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="contact.html">Контакты</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="block__item">
                        <div class="block__title">
                            <h5 class="trans-it">Товары</h5>
                        </div>
                        <div class="block__text">
                            <div class="footer-block1-second">
                                <ul>
                                    <li>
                                        <a class="trans-it" href="teplovoe.html">Тепловое оборудование</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="salat_bary.html">Салат бары</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="linii_razdachi.html">Линии раздачи</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="neutral.html">Нейтральное оборудование</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="zont.html">Вентиляционные зонты</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="holod.html">Холодильные оборудования</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="container.html">Гастроемкости</a>
                                    </li>
                                    <li>
                                        <a class="trans-it" href="mixer.html">Электромеханическое оборудование</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="block__item block__item__ala">
                        <div class="block__title">
                            <h5 class="trans-it">г. Алматы</h5>
                        </div>
                        <div class="block__text" style="padding-top: 20px;">
    
                            <div class="foot-one wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-ala" style="width: 100%">
    
                                            <p><a class="almaty_info" href="almaty.html">ул. Мынбаева 43 (уг. ул. между Ауезова
                                                    и Манаса) 050008
                                                </a>
                                            </p>
    
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-two wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-ala" style="width: 100%">
                                            <p style="margin-bottom: 5px;"><a href="tel:87273449900" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">8 (727) 344-99-00</a></p>
                                            <p><a href="tel:87012667700" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">+7 (701) 266-77-00</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-three wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-ala" style="width: 100%">
                                            <p><a href="mailto:zakaz@idiamarket.kz">zakaz@idiamarket.kz</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="block__item block__item__nur">
                        <div class="block__title">
                            <h5 class="trans-it">г. Астана</h5>
                        </div>
                        <div class="block__text" style="padding-top: 20px;">
    
                            <div class="foot-one wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p><a class="almaty_info" href="astana.html">ул. Бейсекбаева 24/1, 2-этаж бизнес центр DARA.
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-two wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p style="margin-bottom: 5px;"><a href="tel:87172279900" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">8 (7172) 27-99-00</a></p>
                                            <p><a href="tel:87015112200" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">+7 (701) 511-22-00</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-three wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p><a href="mailto:astana@idiamarket.kz">astana@idiamarket.kz</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="block__item block__item__shym">
                        <div class="block__title">
                            <h5 class="trans-it">г. Шымкент</h5>
                        </div>
                        <div class="block__text" style="padding-top: 20px;">
    
                            <div class="foot-one wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p><a class="almaty_info" href="shymkent.html">ул. Мадели кожа 35/1, (уг.ул. Байтурсынова) 1-этаж, бизнес-центр BNK
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-two wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p style="margin-bottom: 5px;"><a href="tel:87252399900" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">8 (7252) 39-99-00</a></p>
                                            <p><a href="tel:87019447700" onclick="gtag('event', 'click phone numbers', {'event_category': 'link', 'event_action': 'click'});">+7 (701) 944 77 00</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="foot-three wrappers">
                                <div class="foot-one-right">
                                    <div class="row footer-address-grid-right">
                                        <div class="footer-city-asa" style="width: 100%">
                                            <p><a href="mailto:shymkent@idiamarket.kz">shymkent@idiamarket.kz</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="footer-row">
    
                    <div class="col_1">
                        <div class="footer_column footer_contact">
                            <div class="logo_container footer_logo_container">
                                <div class="logo">
                                    <a href="index.html"><img src="images/logo.png"></a>
                                </div>
                            </div>
    
                            <hr class="hr-footer first_change_hr">
    
                            <div class="footer_phone">
                                <a href="tel:87273449900">8 (727) 344-99-00</a>
                            </div>
                            <div class="footer_phone">
                                <a href="tel:87012667700">+7 (701) 266-77-00</a>
                            </div>
                            <div class="footer_contact_text">
                                <a href="almaty.html">
                                    <p>г. Алматы, ул. Мынбаева 43 (уг.ул. Манаса), 1-этаж, 050008</p>
                                </a>
                                <p></p>
                            </div>
    
                            <hr class="hr-footer">
    
                            <div class="footer_phone">
                                <a href="tel:87172279900">8 (7172) 27-99-00</a>
                            </div>
                            <div class="footer_phone">
                                <a href="tel:87015112200">+7 (701) 511-22-00</a>
                            </div>
                            <div class="footer_contact_text">
                                <a href="astana.html">
                                    <p>г. Астана, ул. Бейсекбаева 24/1, 2-этаж бизнес центр DARA</p>
                                </a>
                            </div>
    
                            <hr class="hr-footer">
    
                            <div class="footer_phone">
                                <a href="tel:87252399900">8 (7252) 39-99-00</a>
                            </div>
                            <div class="footer_phone">
                                <a href="tel:87019447700">+7 (701) 944-77-00</a>
                            </div>
                            <div class="footer_contact_text">
                                <a href="shymkent.html">
                                    <p>г. Шымкент, ул. Мадели кожа 35/1, (уг.ул. Байтурсынова) 1-этаж, бизнес-центр BNK</p>
                                </a>
                            </div>
    
                            <hr class="hr-footer first_change_hr">
    
                        </div>
                    </div>
    
                    <div class="main_links_container">
                        <div class="col_2">
                            <div class="footer_column">
                                <div class="footer_subtitle"><a href="index.html">Главная</a></div>
                                <ul class="footer_list">
    
    
                                    <li><a href="design.html">3D Дизайн</a></li>
                                    <li><a href="delivery.html">Доставка</a></li>
                                    <li><a href="about.html">О нас</a></li>
                                    <li><a href="otzyvy.php">Отзывы</a></li>
                                    <li><a href="contact.html">Контакты</a></li>
                                </ul>
    
                            </div>
                        </div>
    
                        <div class="col_3">
    <div class='d-flex align-items-between flex-column' >
                            <div class="footer_column">
                                <div class="footer_subtitle"><a href="catalog.html">Каталог</a></div>
                                <ul class="footer_list">
    
                                    <li><a href="teplovoe.html">Тепловое оборудование</a></li>
                                    <li><a href="salat_bary.html">Салат бары</a></li>
                                    <li><a href="linii_razdachi.html">Линии раздачи</a></li>
                                    <li><a href="zont.html">Вентиляционные зонты</a></li>
                                    <li><a href="neutral.html">Нейтральное оборудование</a></li>
                                    <li><a href="holod.html">Холодильное оборудование</a></li>
    
                                </ul>
                            </div>
                            <div class="social-btns" style='margin-top: 150px;' >  
                    <div class='content'>
                        <a class="btn instagram" href="https://www.instagram.com/idiamarket/">
                        <i class="fas fa-instagram"></i></a>
                        <a class="btn google" href="https://api.whatsapp.com/send/?phone=77012336600&amp;text&amp;app_absent=0">
                        <i class="fas fa-whatsapp"></i></a>
                        <a class="btn dribbble" href="https://www.youtube.com/channel/UCNDMIviMuZOhhCP7xoxGYAA/videos">
                        <i class="fas fa-youtube"></i></a>
</div>
</div>
                    </div>
                        </div>
                    
                    </div>
    
                </div>
                <p class="footer-prava" style="text-align:center; margin-top:2em">&copy 2010-2023 Horest</p>
            </div>
     `;

  const body = document.querySelector("body");
  const categories_menu_container = document.createElement("section");
  categories_menu_container.classList.add("categories-menu-container");
  categories_menu_container.innerHTML = `
                <nav class="categories-menu">
                    <ul class="categories-menu-list">
                        <a class="categories-menu-link" href="teplovoe.html">

                            <li id="10" class="categories-menu-item">
                                <span class="dots red-c">.</span> Тепловое оборудование
                                <ul id="10" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="plita.html">
                                        <li id="11" class="sub-categories-menu-item">Плиты электрические</li>
                                    </a>
                                    <a class="categories-menu-link" href="zhar.html">
                                        <li id="12" class="sub-categories-menu-item">Жарочные поверхности</li>
                                    </a>
                                    <a class="categories-menu-link" href="skovoroda.html">
                                        <li id="13" class="sub-categories-menu-item">Сковороды электрические</li>
                                    </a>
                                    <a class="categories-menu-link" href="fryer.html">
                                        <li id="14" class="sub-categories-menu-item">Фритюрницы</li>
                                    </a>
                                    <a class="categories-menu-link" href="poverhnost.html">
                                        <li id="15" class="sub-categories-menu-item">Поверхности рабочие</li>
                                    </a>
                                    <a class="categories-menu-link" href="marmit.html">
                                        <li id="16" class="sub-categories-menu-item">Мармиты вторых блюд</li>
                                    </a>
                                    <a class="categories-menu-link" href="shkaf_zhar.html">
                                        <li id="17" class="sub-categories-menu-item">Жарочные шкафы</li>
                                    </a>
                                    <a class="categories-menu-link" href="shkaf_proofing.html">
                                        <li id="18" class="sub-categories-menu-item">Шкафы расстоечные</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="salat_bary.html">
                            <li id="20" class="categories-menu-item">
                                <span class="dots red-c">.</span> Салат бары
                                <ul id="20" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="salatbar_neutral.html">
                                        <li id="21" class="sub-categories-menu-item">Салат бар нейтральный</li>
                                    </a>
                                    <a class="categories-menu-link" href="salatbar_teplovoi.html">
                                        <li id="22" class="sub-categories-menu-item">Салат бар тепловой</li>
                                    </a>
                                    <a class="categories-menu-link" href="salatbar_holod.html">
                                        <li id="23" class="sub-categories-menu-item">Салат бар охлаждаемый</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="linii_razdachi.html">
                            <li id="30" class="categories-menu-item">
                                <span class="dots red-c">.</span>Линии раздачи
                                <ul id="30" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="vega.html">
                                        <li id="31" class="sub-categories-menu-item">Линии раздачи Вега</li>
                                    </a>
                                    <a class="categories-menu-link" href="master.html">
                                        <li id="32" class="sub-categories-menu-item">Линии раздачи Мастер</li>
                                    </a>
                                    <a class="categories-menu-link" href="school.html">
                                        <li id="33" class="sub-categories-menu-item">Линии раздачи Школьник</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="neutral.html">
                            <li id="40" class="categories-menu-item">
                                <span class="dots red-c">.</span>Нейтральное оборудование
                                <ul id="4" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="stol_neutral.html">
                                        <li id="41" class="sub-categories-menu-item">Столы из нержавейки</li>
                                    </a>
                                    <a class="categories-menu-link" href="moika_neutral.html">
                                        <li id="42" class="sub-categories-menu-item">Мойки из нержавейки</li>
                                    </a>
                                    <a class="categories-menu-link" href="stellazh_neutral.html">
                                        <li id="43" class="sub-categories-menu-item">Стеллажи из нержавейки</li>
                                    </a>
                                    <a class="categories-menu-link" href="polka_neutral.html">
                                        <li id="44" class="sub-categories-menu-item">Полки и подставки из нержавейки</li>
                                    </a>
                                    <a class="categories-menu-link" href="telezhka_neutral.html">
                                        <li id="45" class="sub-categories-menu-item">Тележки для транспортировки</li>
                                    </a>
                                    <a class="categories-menu-link" href="podves_neutral.html">
                                        <li id="46" class="sub-categories-menu-item">Подвесы для туш</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="zont.html">
                            <li id="50" class="categories-menu-item">
                                <span class="dots red-c">.</span>Вентиляционные зонты
                                <ul id="50" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="zont_vytyazhnoi.html">
                                        <li id="51" class="sub-categories-menu-item">Зонт вентиляционный пристенный вытяжной</li>
                                    </a>
                                    <a class="categories-menu-link" href="zont_pritochnyi.html">
                                        <li id="52" class="sub-categories-menu-item">Зонт вентиляционный приточно-вытяжной</li>
                                    </a>
                                    <a class="categories-menu-link" href="zont_nastennyi.html">
                                        <li id="53" class="sub-categories-menu-item">Зонт вентиляционный настенный</li>
                                    </a>
                                    <a class="categories-menu-link" href="zont_ostrovnoi.html">
                                        <li id="54" class="sub-categories-menu-item">Зонт вентиляционный островной</li>
                                    </a>
                                    <a class="categories-menu-link" href="zont_type1.html">
                                        <li id="55" class="sub-categories-menu-item">Зонт вентиляционный островной тип 1</li>
                                    </a>
                                    <a class="categories-menu-link" href="zont_type2.html">
                                        <li id="56" class="sub-categories-menu-item">Зонт вентиляционный островной тип 2</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="holod.html">
                            <li id="60" class="categories-menu-item">
                                <span class="dots red-c">.</span>Холодильное оборудование
                                <ul id="60" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="holod_shkaf.html">
                                        <li id="61" class="sub-categories-menu-item">Холодильные шкафы</li>
                                    </a>
                                    <a class="categories-menu-link" href="holod_stol.html">
                                        <li id="62" class="sub-categories-menu-item">Холодильные столы</li>
                                    </a>
                                    <a class="categories-menu-link" href="moroz_lar.html">
                                        <li id="63" class="sub-categories-menu-item">Морозильные лари</li>
                                    </a>
                                    <a class="categories-menu-link" href="holod_kondit.html">
                                        <li id="64" class="sub-categories-menu-item">Кондитерские витрины</li>
                                    </a>
                                    <a class="categories-menu-link" href="holod_nastol.html">
                                        <li id="65" class="sub-categories-menu-item">Настольные витрины</li>
                                    </a>
                                    <a class="categories-menu-link" href="holod_camera.html">
                                        <li id="66" class="sub-categories-menu-item">Холодильные камеры</li>
                                    </a>
                                    <a class="categories-menu-link" href="holod_ustanovka.html">
                                        <li id="67" class="sub-categories-menu-item">Холодильные установки</li>
                                    </a>
                                    <a class="categories-menu-link" href="https://icegroup.kz/products.html">
                                        <li id="68" class="sub-categories-menu-item">Другие холодильные оборудование</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="container.html">
                            <li id="70" class="categories-menu-item">
                                <span class="dots red-c">.</span>Гастроемкости
                                <ul id="70" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="gastronome.html">
                                        <li id="71" class="sub-categories-menu-item">Гастроемкости из нержавейки</li>
                                    </a>
                                    <a class="categories-menu-link" href="perforated.html">
                                        <li id="72" class="sub-categories-menu-item">Гастроемкости перфорированные</li>
                                    </a>
                                    <a class="categories-menu-link" href="shape.html">
                                        <li id="73" class="sub-categories-menu-item">Формы из нержавейки</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                        <a class="categories-menu-link" href="mixer.html">
                            <li id="80" class="categories-menu-item">
                                <span class="dots red-c">.</span>Электромеханическое оборудование
                                <ul id="80" class="categories-menu-list-displaynone">
                                    <a class="categories-menu-link" href="mixer_7.html">
                                        <li id="81" class="sub-categories-menu-item">Миксер планетарный B7 л</li>
                                    </a>
                                    <a class="categories-menu-link" href="mixer_15.html">
                                        <li id="82" class="sub-categories-menu-item">Миксер планетарный B15 л</li>
                                    </a>
                                    <a class="categories-menu-link" href="dough_mixer.html">
                                        <li id="83" class="sub-categories-menu-item">Тестомес HS20 л</li>
                                    </a>
                                    <a class="categories-menu-link" href="slicer.html">
                                        <li id="84" class="sub-categories-menu-item">Слайсер 250ES-10</li>
                                    </a>
                                    <a class="categories-menu-link" href="blender.html">
                                        <li id="85" class="sub-categories-menu-item">Блендер CB-767</li>
                                    </a>
                                    <a class="categories-menu-link" href="boiler.html">
                                        <li id="86" class="sub-categories-menu-item">Кипятильник WB</li>
                                    </a>
                                </ul>
                            </li>
                        </a>
                    </ul>
                </nav>
                <div class="categories-menu-details">
                    <div class="categories-menu-detail-img-active">
                        <div class="sub-img-active">
                            <img id="" src="" alt="">
                        </div>
                        <div class="category-images-display-none">

                            <img id="10" src="images/products/1.png" alt="">
                            <img id="11" src="images/products/plita/6.jpg" alt="">
                            <img id="12" src="images/products/zhar/4.jpg" alt="">
                            <img id="13" src="images/products/skovoroda/1.jpg" alt="">
                            <img id="14" src="images/products/fryer/4.jpg" alt="">
                            <img id="15" src="images/products/poverh/2.jpeg" alt="">
                            <img id="16" src="images/products/marmit/3.jpg" alt="">
                            <img id="17" src="images/products/shkaf/1.jpg" alt="">
                            <img id="18" src="images/products/proofing/1.jpg" alt="">

                            <img id="20" src="images/products/2.png" alt="">
                            <img id="21" src="images/products/salatbar/2.jpg" alt="">
                            <img id="22" src="images/products/salatbar/1.jpg" alt="">
                            <img id="23" src="images/products/salatbar/3.jpg" alt="">

                            <img id="30" src="images/products/3.png" alt="">
                            <img id="31" src="images/products/linii/products/2.jpg" alt="">
                            <img id="32" src="images/products/linii/products/14.jpg" alt="">
                            <img id="33" src="images/products/linii/products/32.jpg" alt="">

                            <img id="40" src="images/products/4.png" alt="">
                            <img id="41" src="images/products/neutral/stol/main/1.jpg" alt="">
                            <img id="42" src="images/products/neutral/moika/main/7.jpg" alt="">
                            <img id="43" src="images/products/neutral/stellazh/main/4.jpg" alt="">
                            <img id="44" src="images/products/neutral/podstavka/main/4.jpg" alt="">
                            <img id="45" src="images/products/neutral/telezhka/main/1.jpg" alt="">
                            <img id="46" src="images/products/neutral/podvec/main/2.jpg" alt="">

                            <img id="50" src="images/products/6.png" alt="">
                            <img id="51" src="images/products/zont/2.jpg" alt="">
                            <img id="52" src="images/products/zont/1.jpg" alt="">
                            <img id="53" src="images/products/zont/4.jpg" alt="">
                            <img id="54" src="images/products/zont/6.jpg" alt="">
                            <img id="55" src="images/products/zont/3.jpg" alt="">
                            <img id="56" src="images/products/zont/5.jpg" alt="">

                            <img id="60" src="images/products/5.png" alt="">
                            <img id="61" src="images/products/holod/shkaf/27.png" alt="">
                            <img id="62" src="images/products/holod/stol/3.jpg" alt="">
                            <img id="63" src="images/products/holod/lar/2.jpg" alt="">
                            <img id="64" src="images/products/holod/kondit/main/5.png" alt="">
                            <img id="65" src="images/products/holod/nastol/main/4.jpg" alt="">
                            <img id="66" src="images/products/holod/camera/main/4.jpg" alt="">
                            <img id="67" src="images/products/holod/machine/main/6.jpg" alt="">
                            <img id="68" src="images/products/5.png" alt="">

                            <img id="70" src="images/products/7.png" alt="">
                            <img id="71" src="images/products/container/4.png" alt="">
                            <img id="72" src="images/products/container/7.png" alt="">
                            <img id="73" src="images/products/container/11.png" alt="">

                            <img id="80" src="images/products/9.png" alt="">
                            <img id="81" src="images/products/mixer/1.jpg" alt="">
                            <img id="82" src="images/products/mixer/2.jpg" alt="">
                            <img id="83" src="images/products/mixer/3.jpg" alt="">
                            <img id="84" src="images/products/mixer/4.jpg" alt="">
                            <img id="85" src="images/products/mixer/5.jpg" alt="">
                            <img id="86" src="images/products/mixer/6.png" alt="">
                        </div>
                    </div>
                </div>
         `;

  body.appendChild(categories_menu_container);

  // ___________________________________catalog category hover active_________________________________________

  let cat_menu_container = document.querySelector(".cat_menu_container");
  let cat_menu_container_li = document.querySelectorAll(
    ".categories-menu-item"
  );
  let cat_menu_container_li_sub = document.querySelectorAll(
    ".sub-categories-menu-item"
  );
  let categories_menu_container1 = document.querySelector(
    ".categories-menu-container"
  );
  let categories_menu_detail_active = document.querySelector(
    ".categories-menu-detail-active"
  );
  let mainImageCat = document.querySelector(".sub-img-active img");
  let ImageCat = document.querySelectorAll(".category-images-display-none img");

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
  }

  // _____________________________________________

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
  });

  // ______________________________________________________________________________________________________________

  $(".carosel").slick({
    infinite: true,
    autoplay: true,
    autoplaySpeed: 1500,
    // this value should < total # of slides, otherwise the carousel won't slide at all
    slidesToShow: 4,
    slidesToScroll: 1,
    speed: 1000,
    autoplay: true,
    dots: true,
    arrows: true,
    prevArrow: $(".carosel-nav-left"),
    nextArrow: $(".carosel-nav-right"),
  });
});

// _________________________________________Каталог_____________________________________________________________

// select all accordion items
const accItems = document.querySelectorAll(".accordion__item");

// add a click event for all items
accItems.forEach((acc) => acc.addEventListener("click", toggleAcc));

function toggleAcc() {
  // remove active class from all items exept the current item (this)
  accItems.forEach((item) =>
    item != this ? item.classList.remove("accordion__item--active") : null
  );

  // toggle active class on current item
  if (this.classList != "accordion__item--active") {
    this.classList.toggle("accordion__item--active");
  }
}

// ___________________________________Footer spoiler_________________________________________

$(document).ready(function () {
  $(".block__title").click(function (event) {
    if ($(".block").hasClass("one")) {
      $(".block__title").not($(this)).removeClass("active");
      $(".block__text").not($(this).next()).slideUp(300);
    }
    $(this).toggleClass("active").next().slideToggle(300);
  });
});

// ___________________________________Burger Menu__________________________________________

$(document).ready(function () {
  $(".nav-button").click(function () {
    $("body").toggleClass("nav-open");
  });
});

// ____________________Slick.js______________________

if (document.querySelector("#office_info_img") != null) {
  $("#office_info_img").slick({
    dots: true,
    infinite: true,
    speed: 500,
    fade: true,
    autoplay: true,
    autoplaySpeed: 8000,
    cssEase: "linear",
  });
}

// __________________Типы предприятия слайдер index.html________________________

if (document.querySelector("#flexiselDemo4") != null) {
  $("#flexiselDemo4").slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
        },
      },
    ],
    responsive: [
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 3,
        },
      },
    ],
    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  });
}

// ______________________________________________________________________________________________________________

(function () {
  var expand;
  expand = function () {
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
}).call(this);

$("select").each(function () {
  var $this = $(this),
    $options = $(this).children("option").length;

  $this.addClass("select-hidden");
  $this.wrap("<div class='select'></div>");
  $this.after("<div class='select-styled'></div>");

  var $styledSelect = $this.next("div.select-styled");
  $styledSelect.text($this.children("option").eq(0).text());

  var $list = $("<ul />", {
    class: "select-options",
  }).insertAfter($styledSelect);

  for (var i = 0; i < $options; i++) {
    $("<li />", {
      text: $this.children("option").eq(i).text(),
      rel: $this.children("option").eq(i).val(),
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
    "border-top": "0px",
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
}).call(this);

// ________________________Design page (height of fixed section)_________________________

$(function () {
  $(".about__block1__welcome, .about__block1__img1, .scroll-container").css({
    height: $(window).innerHeight() - $(".super_container").height(),
  });
  $(window).resize(function () {
    $(".about__block1__welcome, .about__block1__img1, .scroll-container").css({
      height: $(window).innerHeight() - $(".super_container").height(),
    });
  });
});

// ________________________About page (height of fixed section)_________________________

$(function () {
  $(".about_section_not1").css({
    height: $(window).innerHeight(),
  });
  $(window).resize(function () {
    $(".about_section_not1").css({
      height: $(window).innerHeight(),
    });
  });
});

// ___________image fixed don not work in the iOS mobile_____________
let about__block1__img__main = document.querySelector(
  ".about__block1__img__main"
);

if (window.matchMedia("(max-width: 767px)").matches) {
  if (about__block1__img__main != null) {
    document.querySelector(".about__block1__img__main").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.497), rgba(0, 0, 0, 0.497)), url('/images/delivery/4.webp') no-repeat center / cover";
    // document.querySelector(".delivery__block3__child").style.background =
    //   "linear-gradient(rgba(0, 0, 0, 0.597), rgba(0, 0, 0, 0.597)), url('/images/delivery/7.webp') no-repeat center / cover";
    // document.querySelector(
    //   ".delivery__block5 .delivery__block3__child"
    // ).style.background =
    //   "linear-gradient(rgba(0, 0, 0, 0.597), rgba(0, 0, 0, 0.597)), url('/images/delivery/9.webp') no-repeat bottom / cover";
  }
  if (document.querySelector(".scroll-container") != null) {
    document.querySelector(".about_section2").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/2.webp') no-repeat center / cover";
    document.querySelector(".about_section3").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/3.webp') no-repeat center / cover";
    document.querySelector(".about_section4").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/6.webp') no-repeat center / cover";
    document.querySelector(".about_section2").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/restaurant/2.webp') no-repeat center / cover";
    document.querySelector(".about_section5").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/1.webp') no-repeat center / cover";
    document.querySelector(".about_section6").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/3.jpg') no-repeat center / cover";
    // document.querySelector(".about_section7").style.background =
    // "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/home/4.webp') no-repeat center / cover";
    document.querySelector(".about_section8").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/2.webp') no-repeat center / cover";
    document.querySelector(".about_section9").style.background =
      "linear-gradient(rgba(0, 0, 0, 0.397), rgba(0, 0, 0, 0.397)), url('/images/design/new/cafe/4.webp') no-repeat center / cover";
  }
}

// _________________________________________________________________________________________________________

$(".design-project-slider").slick({
  slidesToShow: 2,
  slidesToScroll: 2,
  autoplay: true,
  autoplaySpeed: 3000,
  dots: true,
  responsive: [
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
});

$(".blago_container_slider").slick({
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: false,
  autoplaySpeed: 3000,
  dots: true,
  responsive: [
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
});

// new fullScroll({
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
  setTimeout(() => {
    let preloader = document.getElementById("page-preloader");
    if (preloader) {
      if (!preloader.classList.contains("done")) {
        preloader.classList.add("done");
      }
    }
  }, 800);
};

var acc = document.getElementsByClassName("accordion_btn_characters");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var panel = document.querySelector(".panel_hidden");
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}

(function ($) {
  var CheckboxDropdown = function (el) {
    var _this = this;
    this.isOpen = false;
    this.areAllChecked = false;
    this.$el = $(el);
    this.$label = this.$el.find(".dropdown-label");
    this.$checkAll = this.$el.find('[data-toggle="check-all"]').first();
    this.$inputs = this.$el.find('[type="checkbox"]');

    this.onCheckBox();

    this.$label.on("click", function (e) {
      e.preventDefault();
      _this.toggleOpen();
    });

    this.$checkAll.on("click", function (e) {
      e.preventDefault();
      _this.onCheckAll();
    });

    this.$inputs.on("change", function (e) {
      _this.onCheckBox();
    });
  };

  CheckboxDropdown.prototype.onCheckBox = function () {
    this.updateStatus();
  };

  CheckboxDropdown.prototype.updateStatus = function () {
    var checked = this.$el.find(":checked");

    this.areAllChecked = false;
    this.$checkAll.html("Check All");

    if (checked.length <= 0) {
      this.$label.html("Select Options");
    } else if (checked.length === 1) {
      this.$label.html(checked.parent("label").text());
    } else if (checked.length === this.$inputs.length) {
      this.$label.html("All Selected");
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
    } else {
      this.$label.html(checked.length + " Selected");
    }
  };

  CheckboxDropdown.prototype.onCheckAll = function (checkAll) {
    if (!this.areAllChecked || checkAll) {
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
      this.$inputs.prop("checked", true);
    } else {
      this.areAllChecked = false;
      this.$checkAll.html("Check All");
      this.$inputs.prop("checked", false);
    }

    this.updateStatus();
  };

  CheckboxDropdown.prototype.toggleOpen = function (forceOpen) {
    var _this = this;

    if (!this.isOpen || forceOpen) {
      this.isOpen = true;
      this.$el.addClass("on");
      $(document).on("click", function (e) {
        if (!$(e.target).closest("[data-control]").length) {
          _this.toggleOpen();
        }
      });
    } else {
      this.isOpen = false;
      this.$el.removeClass("on");
      $(document).off("click");
    }
  };

  var checkboxesDropdowns = document.querySelectorAll(
    '[data-control="checkbox-dropdown"]'
  );
  for (var i = 0, length = checkboxesDropdowns.length; i < length; i++) {
    new CheckboxDropdown(checkboxesDropdowns[i]);
  }
})(jQuery);

[...document.getElementsByTagName("dt")].forEach(function (node) {
  node.addEventListener("click", function (e) {
    this.classList.toggle("active");
  });
});
