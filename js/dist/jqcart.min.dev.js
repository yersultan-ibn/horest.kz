"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 jQuery jqCart Plugin v1.1.2
 requires jQuery v1.9 or later

 https://incode.pro/

 Date: Date: 2016-05-18 19:15
*/
(function (d) {
  var formatter = function formatter(priceSum) {
    var mn = 0;
    var price = priceSum.toString();

    for (var ij = price.length; ij > 0; ij--) {
      if (mn % 3 == 0) {
        price = [price.slice(0, ij), " ", price.slice(ij)].join("");
      }

      mn++;
    }

    return price;
  };

  var a,
      k,
      g = "",
      n = 0,
      p = !1,
      l = d('<div class="jqcart-cart-label"><span class="jqcart-total-cnt">0</span></div>'),
      h = {
    buttons: ".add_item",
    cartLabel: "body",
    visibleLabel: !1,
    openByAdding: !1,
    handler: "/",
    currency: "$"
  },
      c = {
    init: function init(b) {
      h = d.extend(h, b);
      a = c.getStorage();

      if (null !== a && Object.keys(a).length) {
        for (var e in a) {
          a.hasOwnProperty(e) && (n += a[e].count);
        }

        p = !0;
      }

      l.prependTo(h.cartLabel)[p || h.visibleLabel ? "show" : "hide"]().on("click", c.openCart).find(".jqcart-total-cnt").text(n);
      d(document).on("click", h.buttons, c.addToCart).on("click", ".jqcart-layout", function (b) {
        b.target === this && c.hideCart();
      }).on("click", ".jqcart-incr", c.changeAmount).on("input keyup", ".jqcart-amount", c.changeAmount).on("click", ".jqcart-del-item", c.delFromCart).on("submit", ".jqcart-orderform", c.sendOrder).on("reset", ".jqcart-orderform", c.hideCart).on("click", ".jqcart-print-order", c.printOrder);
      return !1;
    },
    ccc: function ccc() {
      this.replace(/ /g, "");
    },
    addToCart: function addToCart(b) {
      b.preventDefault();
      k = d(this).data();
      if ("undefined" === typeof k.id) return console.log("\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 ID \u0442\u043E\u0432\u0430\u0440\u0430"), !1;
      a = c.getStorage() || {};
      a.hasOwnProperty(k.id) ? a[k.id].count++ : (k.count = 1, a[k.id] = k);
      c.setStorage(a);
      c.changeTotalCnt(1);
      l.show();
      h.openByAdding && c.openCart();
      return !1;
    },
    delFromCart: function delFromCart() {
      var b = d(this).closest(".jqcart-tr"),
          e = b.data("id");
      a = c.getStorage();
      c.changeTotalCnt(-a[e].count);
      delete a[e];
      c.setStorage(a);
      b.remove();
      c.recalcSum();
      return !1;
    },
    changeAmount: function changeAmount() {
      var b = d(this),
          e = b.hasClass("jqcart-amount"),
          g = +(e ? b.val() : b.data("incr")),
          f = b.closest(".jqcart-tr").data("id");
      a = c.getStorage();
      a[f].count = e ? isNaN(g) || 1 > g ? 1 : g : a[f].count + g;
      1 > a[f].count && (a[f].count = 1);
      e ? b.val(a[f].count) : b.siblings("input").val(a[f].count);
      c.setStorage(a);
      c.recalcSum();
      return !1;
    },
    recalcSum: function recalcSum() {
      var b = 0,
          e,
          a = 0,
          f = 0;
      d(".jqcart-tr").each(function () {
        e = +d(".jqcart-amount", this).val();
        a = Math.ceil(e * d(".jqcart-price", this).text().replace(/ /g, "") * 100) / 100;
        d(".jqcart-sum", this).html(formatter(a) + " " + h.currency);
        b = Math.ceil(100 * (b + a)) / 100;
        f += e;
      });
      d(".jqcart-subtotal strong").text(formatter(b));
      d(".jqcart-total-cnt").text(f);
      0 >= f && (c.hideCart(), h.visibleLabel || l.hide());
      return !1;
    },
    changeTotalCnt: function changeTotalCnt(b) {
      var e = d(".jqcart-total-cnt");
      e.text(+e.text() + b);
      return !1;
    },
    openCart: function openCart() {
      var b = 0;
      a = c.getStorage();
      g = "<p class=\"jqcart-cart-title\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 <span class=\"jqcart-print-order\"></span></p><div class=\"jqcart-table-wrapper\"><div class=\"jqcart-manage-order\"><div class=\"jqcart-thead\"><div class=\"index_count_main\">\u2116</div><div class=\"img-column\"></div><div></div><div class=\"price_of_prod\">\u0426\u0435\u043D\u0430</div><div class=\"kolvo_main\">\u041A\u043E\u043B-\u0432\u043E</div><div>\u0421\u0443\u043C\u043C\u0430</div><div class=\"delete-column\"></div></div>";
      var e;
      var index_count = 0;

      for (e in a) {
        if (a.hasOwnProperty(e)) {
          index_count++;
          var k = Math.ceil(a[e].count * a[e].price * 100) / 100;
          b = Math.ceil(100 * (b + k)) / 100;
          g += '<div class="jqcart-tr" data-id="' + a[e].id + '">'; // g += '<div class="jqcart-small-td"></div>';

          g += '<div class="index_count"><b>' + index_count + "</b></div>";
          g += '<div class="jqcart-small-td jqcart-item-img"><img src="' + a[e].img + '" href="" alt=""></div>';
          g += '<div class="jqcart-small-title">' + '<div class="jqcart-small-title-code">Код товара: ' + a[e].id + "</div>" + a[e].title + "</div>";
          g += '<div class="jqcart-price">' + formatter(a[e].price) + "</div>";
          g += '<div class="kolvo"><span class="jqcart-incr" data-incr="-1">&#8211;</span><input type="text" class="jqcart-amount" value="' + a[e].count + '"><span class="jqcart-incr" data-incr="1">+</span></div>';
          g += '<div class="jqcart-sum">' + formatter(k) + " " + h.currency + "</div>";
          g += '<div class="jqcart-small-td"><span class="jqcart-del-item"></span></div>';
          g += "</div>";
        }
      }

      g += "</div></div>";
      g += "<div class=\"jqcart-subtotal\"><i>\u0418\u0442\u043E\u0433\u043E: &nbsp&nbsp <strong>" + formatter(b) + "</strong> " + h.currency + "</i></div>";
      b = b ? g + "<p class=\"jqcart-cart-title\">\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F:</p><div class=\"form_main_container\"><form class=\"jqcart-orderform\" method=\"post\" action=\"/request/handler.php\"><p><label class=\"contact-title\">\u0424\u0418\u041E:</label><input type=\"text\" name=\"user_name\"></p><p><label class=\"contact-title\">\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</label><input id=\"phone\" type=\"text\" name=\"user_phone\" placeholder=\"+7\"></p><p><label class=\"contact-title\">Email:</label><input type=\"text\" name=\"user_mail\"></p>   <p><label class=\"contact-title\">\u0413\u043E\u0440\u043E\u0434:</label><select name=\"city_text\" class=\"dropdown-select-form\"><option name=\"\u0410\u043B\u043C\u0430\u0442\u044B\" value=\"\u0410\u043B\u043C\u0430\u0442\u044B\" selected=\"selected\">\u0410\u043B\u043C\u0430\u0442\u044B</option><option name=\"\u041D\u0443\u0440-\u0421\u0443\u043B\u0442\u0430\u043D\" value=\"\u041D\u0443\u0440-\u0421\u0443\u043B\u0442\u0430\u043D\">\u041D\u0443\u0440-\u0421\u0443\u043B\u0442\u0430\u043D</option><option name=\"\u0428\u044B\u043C\u043A\u0435\u043D\u0442\" value=\"\u0428\u044B\u043C\u043A\u0435\u043D\u0442\">\u0428\u044B\u043C\u043A\u0435\u043D\u0442</option><option name=\"\u0410\u043A\u0442\u043E\u0431\u0435\" value=\"\u0410\u043A\u0442\u043E\u0431\u0435\">\u0410\u043A\u0442\u043E\u0431\u0435</option><option name=\"\u0410\u043A\u0442\u0430\u0443\" value=\"\u0410\u043A\u0442\u0430\u0443\">\u0410\u043A\u0442\u0430\u0443</option><option name=\"\u0410\u0442\u044B\u0440\u0430\u0443\" value=\"\u0410\u0442\u044B\u0440\u0430\u0443\">\u0410\u0442\u044B\u0440\u0430\u0443</option><option name=\"\u0416\u0430\u043D\u0430\u043E\u0437\u0435\u043D\" value=\"\u0416\u0430\u043D\u0430\u043E\u0437\u0435\u043D\">\u0416\u0430\u043D\u0430\u043E\u0437\u0435\u043D</option><option name=\"\u0416\u0435\u0437\u043A\u0430\u0437\u0433\u0430\u043D\" value=\"\u0416\u0435\u0437\u043A\u0430\u0437\u0433\u0430\u043D\">\u0416\u0435\u0437\u043A\u0430\u0437\u0433\u0430\u043D</option><option name=\"\u041A\u0430\u0440\u0430\u0433\u0430\u043D\u0434\u044B\" value=\"\u041A\u0430\u0440\u0430\u0433\u0430\u043D\u0434\u044B\">\u041A\u0430\u0440\u0430\u0433\u0430\u043D\u0434\u044B</option><option name=\"\u041A\u043E\u043A\u0448\u0435\u0442\u0430\u0443\" value=\"\u041A\u043E\u043A\u0448\u0435\u0442\u0430\u0443\">\u041A\u043E\u043A\u0448\u0435\u0442\u0430\u0443</option><option name=\"\u041A\u043E\u0441\u0442\u0430\u043D\u0430\u0439\" value=\"\u041A\u043E\u0441\u0442\u0430\u043D\u0430\u0439\">\u041A\u043E\u0441\u0442\u0430\u043D\u0430\u0439</option><option name=\"\u041A\u044B\u0437\u044B\u043B\u043E\u0440\u0434\u0430\" value=\"\u041A\u044B\u0437\u044B\u043B\u043E\u0440\u0434\u0430\">\u041A\u044B\u0437\u044B\u043B\u043E\u0440\u0434\u0430</option><option name=\"\u041F\u0430\u0432\u043B\u043E\u0434\u0430\u0440\" value=\"\u041F\u0430\u0432\u043B\u043E\u0434\u0430\u0440\">\u041F\u0430\u0432\u043B\u043E\u0434\u0430\u0440</option><option name=\"\u041F\u0435\u0442\u0440\u043E\u043F\u0430\u0432\u043B\u043E\u0432\u0441\u043A\" value=\"\u041F\u0435\u0442\u0440\u043E\u043F\u0430\u0432\u043B\u043E\u0432\u0441\u043A\">\u041F\u0435\u0442\u0440\u043E\u043F\u0430\u0432\u043B\u043E\u0432\u0441\u043A</option><option name=\"\u0421\u0435\u043C\u0435\u0439\" value=\"\u0421\u0435\u043C\u0435\u0439\">\u0421\u0435\u043C\u0435\u0439</option><option name=\"\u0422\u0430\u043B\u0434\u044B\u043A\u043E\u0440\u0433\u0430\u043D\" value=\"\u0422\u0430\u043B\u0434\u044B\u043A\u043E\u0440\u0433\u0430\u043D\">\u0422\u0430\u043B\u0434\u044B\u043A\u043E\u0440\u0433\u0430\u043D</option><option name=\"\u0422\u0430\u0440\u0430\u0437\" value=\"\u0422\u0430\u0440\u0430\u0437\">\u0422\u0430\u0440\u0430\u0437</option><option name=\"\u0422\u0443\u0440\u043A\u0435\u0441\u0442\u0430\u043D\" value=\"\u0422\u0443\u0440\u043A\u0435\u0441\u0442\u0430\u043D\">\u0422\u0443\u0440\u043A\u0435\u0441\u0442\u0430\u043D</option><option name=\"\u0423\u0440\u0430\u043B\u044C\u0441\u043A\" value=\"\u0423\u0440\u0430\u043B\u044C\u0441\u043A\">\u0423\u0440\u0430\u043B\u044C\u0441\u043A</option><option name=\"\u0423\u0441\u0442\u044C-\u041A\u0430\u043C\u0435\u043D\u043E\u0433\u043E\u0440\u0441\u043A\" value=\"\u0423\u0441\u0442\u044C-\u041A\u0430\u043C\u0435\u043D\u043E\u0433\u043E\u0440\u0441\u043A\">\u0423\u0441\u0442\u044C-\u041A\u0430\u043C\u0435\u043D\u043E\u0433\u043E\u0440\u0441\u043A</option></select></p><p><label class=\"contact-title\">\u0410\u0434\u0440\u0435\u0441:</label><input type=\"text\" name=\"user_address\"></p><p><label class=\"contact-title\">\u041A\u043E\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439:</label><textarea name=\"user_comment\"></textarea></p><p class=\"form_submit_buttons\"><input class=\"submit submit_form\" type=\"submit\" name=\"submit\" value=\"\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437\"><input class=\"reset\" type=\"reset\" value=\"\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043F\u043E\u043A\u0443\u043F\u043A\u0430\u043C\"></p></form></div>" : "<h2 class=\"jqcart-empty-cart\">\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u043F\u0443\u0441\u0442\u0430</h2>";
      d('<div class="jqcart-layout"><div class="jqcart-checkout">123</div><script defer>$("#phone").inputmask({mask: ["+7 999 999 99 99"],jitMasking: 3,showMaskOnHover: false,autoUnmask: true});</script></div>').appendTo("body").find(".jqcart-checkout").html(b);
    },
    hideCart: function hideCart() {
      d(".jqcart-layout").fadeOut("fast", function () {
        d(this).remove();
      });
      return !1;
    },
    sendOrder: function sendOrder(b) {
      b.preventDefault();
      b = d(this);
      if ("" === d.trim(d("[name=user_name]", b).val()) || "" === d.trim(d("[name=user_phone]", b).val())) return d("<p class=\"jqcart-error\">\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0443\u043A\u0430\u0436\u0438\u0442\u0435 \u0441\u0432\u043E\u0435 \u0438\u043C\u044F \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D!</p>").insertBefore(b).delay(3e3).fadeOut(), !1;
      d.ajax({
        url: h.handler,
        type: "POST",
        dataType: "json",
        data: {
          orderlist: d.param(c.getStorage()),
          userdata: b.serialize()
        },
        error: function error() {},
        success: function success(b) {
          d(".jqcart-checkout").html("<p>" + b.message + "</p>");
          b.errors || setTimeout(m.clearCart, 2e3);
        }
      });
    },
    printOrder: function printOrder() {
      var b = d(this).closest(".jqcart-checkout").prop("outerHTML");
      if (!b) return !1;
      var a = window.open("", "\u041F\u0435\u0447\u0430\u0442\u044C \u0437\u0430\u043A\u0430\u0437\u0430", "width" + screen.width + ",height=" + screen.height),
          c = d(a.opener.document).find('link[href$="jqcart.css"]').attr("href"),
          f = new Date(),
          f = ("0" + f.getDate()).slice(-2) + "-" + ("0" + (f.getMonth() + 1)).slice(-2) + "-" + f.getFullYear() + " " + ("0" + f.getHours()).slice(-2) + ":" + ("0" + f.getMinutes()).slice(-2) + ":" + ("0" + f.getSeconds()).slice(-2);
      a.document.write("<html><head><title>\u0417\u0430\u043A\u0430\u0437 " + f + "</title>");
      a.document.write('<link rel="stylesheet" href="' + c + '" type="text/css" />');
      a.document.write("</head>< body >");
      a.document.write(b);
      a.document.write("< /body > < /html > ");
      setTimeout(function () {
        a.document.close();
        a.focus();
        a.print();
        a.close();
      }, 100);
      return !0;
    },
    setStorage: function setStorage(a) {
      localStorage.setItem("jqcart", JSON.stringify(a));
      return !1;
    },
    getStorage: function getStorage() {
      return JSON.parse(localStorage.getItem("jqcart"));
    }
  },
      m = {
    clearCart: function clearCart() {
      localStorage.removeItem("jqcart");
      l[h.visibleLabel ? "show" : "hide"]().find(".jqcart-total-cnt").text(0);
      c.hideCart();
      var card_count_display1 = document.querySelector(".my-cart-badge");
      var card_count1 = document.querySelector(".jqcart-total-cnt");

      if (card_count1.innerHTML == "0") {
        card_count_display1.classList.add("card_count_display");
      }
    },
    openCart: c.openCart,
    printOrder: c.printOrder,
    test: function test() {
      c.getStorage();
    }
  };

  d.jqCart = function (a) {
    if (m[a]) return m[a].apply(this, Array.prototype.slice.call(arguments, 1));
    if ("object" !== _typeof(a) && a) d.error("\u041C\u0435\u0442\u043E\u0434 \u0441 \u0438\u043C\u0435\u043D\u0435\u043C \"" + a + "\" \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442!");else return c.init.apply(this, arguments);
  }; // __________________________________________________________________________________________


  $(document).ready(function () {
    var card_count_display = document.querySelector(".my-cart-badge");
    $("#fly, .fly").click(function () {
      $("#target").clone().css({
        position: "absolute",
        "z-index": "100"
      }).appendTo("#fly").animate({
        opacity: 0.8,
        marginLeft: 550,
        marginTop: -750,

        /* Важно помнить, что названия СSS-свойств пишущихся  
                                                                                                                                через дефис заменяются на аналогичные в стиле "camelCase" */
        width: 100,
        height: 100
      }, 500, function () {
        $(this).remove();
      });
      card_count_display.classList.remove("card_count_display");
    });
    $(function () {
      "use strict"; // инициализация плагина

      $.jqCart({
        buttons: ".add_item",
        handler: "../request/handler.php",
        cartLabel: ".label-place",
        visibleLabel: true,
        openByAdding: false,
        currency: "₸"
      }); // Пример с дополнительными методами

      $("#open").click(function () {
        $.jqCart("openCart"); // открыть корзину

        var dropdown_select_form = document.querySelector(".dropdown-select-form");

        if (dropdown_select_form != null) {
          dropdown_select_form.addEventListener("change", function () {
            if (this.value == "Нур-Султан" || this.value == "Кокшетау" || this.value == "Караганды" || this.value == "Павлодар" || this.value == "Петропавловск") {
              $.jqCart({
                handler: "../request/handler2.php"
              });
              return;
            } else if (this.value == "Шымкент") {
              $.jqCart({
                handler: "../request/handler3.php"
              });
              return;
            } else {
              $.jqCart({
                handler: "../request/handler.php"
              });
              return;
            }
          });
        }

        var jqcart_del_item = document.querySelector(".jqcart-del-item");

        if (jqcart_del_item != null) {
          jqcart_del_item.addEventListener("click", function () {
            card_count_display.classList.add("card_count_display");
          });
        } // ________________________________Telephon number format___________________________________________


        $("#phone").inputmask({
          mask: ["+7 999 999 99 99"],
          jitMasking: 3,
          showMaskOnHover: false,
          autoUnmask: true
        }); // _________________________________________________________________________________________________
        // let submit_form = document.querySelector(".submit_form");
        // submit_form.setAttribute(
        //     "onclick",
        //     "gtag('event', 'submit form', { 'event_category': 'link3', 'event_action': 'click3' })"
        // );
      });
      var card_count = document.querySelector(".jqcart-total-cnt");

      if (card_count.innerHTML == "0") {
        card_count_display.classList.add("card_count_display");
      } // __________________________________________________________________________________________________

    });
  }); // _______________________________________________________________________________________
})(jQuery);