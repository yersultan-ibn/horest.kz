"use strict";

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
}

console.log(false && 1 && []); // false

console.log(" " && true && 5); // 5

console.log(null || 1 || undefined); // 1

function logName(name) {
  var n = name || "Mark";
  console.log(n);
}

logName("sark"); // Mark