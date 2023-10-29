function displayList(array) {
    let blockViewUl = document.querySelector(".slick-track");
    blockViewUl.innerHTML = "";

    array.map((a) => {
        var formatter = function(priceSum) {
            let mn = 0;
            let price = priceSum.toString();
            for (let ij = price.length; ij > 0; ij--) {
                if (mn % 3 == 0) {
                    price = [price.slice(0, ij), " ", price.slice(ij)].join("");
                }
                mn++;
            }
            return price;
        };

        let item = document.createElement("li");
        item.classList.add("category-page-list__item");

        item.innerHTML = `
                    <a class="category-page-list__item-link" role="link" tabindex="0" href="${
                      a.link
                    }">
                        <div class="ProductCardV category-page-list__product" role="button" tabindex="0">
                            <div class="ProductCardV__ImgWrapper">
                                <div class="LazyImage ProductCardV__Img --loaded">
                                    <div style="padding-bottom: 100%;"></div><img alt="" aria-hidden="true" class="LazyImage__Placeholder" src="${
                                      a.img
                                    }">
                                </div>
                            </div>
                            <div class="ProductCardV__TitleAndPaymentWrapper">
                                <div class="ProductCardV__TitleWrapper">
                                    <p class="Typography ProductCardV__Title --loading Typography__Body Typography__Body_Bold">${
                                      a.title
                                    }</p>
                                </div>
                                <div class="ProductCardV__PaymentWrapper">
                                    <div class="ProductCardV__PricesWrapper">
                                        <div>
                                            <img src="images/razmer.png">
                                            <p>1000х1005х405</p>
                                        </div>
                                        <div>
                                            <p class="Typography ProductCardV__Price ProductCardV__Price_WithOld Typography__Subtitle">от ${formatter(
                                              a.price
                                            )} ₸</p>
                                        </div>
                                        <!--<div>
                                            <p class="Typography ProductCardV__OldPrice Typography__Caption Typography__Caption_Strikethrough">${formatter(
                                              a.price + 30000
                                            )}₸</p>
                                        </div>-->

                                        <div class="mobile_card_button">
                                            <button id="fly" class="product_cart_button fly viewList_product_card add_item btn btn-large btn-primary" data-id="${
                                              a.code
                                            }" data-title="<a href='${
      a.link
    }'>${a.title}</a>" data-price="${a.price}" data-quantity="1" data-img="${
      a.img
    }">
                                                            <img class="basket" src="">&nbsp; В корзину
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="product_extras">
                                <div class="tri">
                                    <div class="tri-item">
                                        <img src="images/nal.png">
                                        <h5>Есть в наличии</h5>
                                    </div>
                                    <div class="tri-item">
                                        <a href="delivery.html">
                                            <img src="images/delivery.png">
                                            <h5>Доставка - БЕСПЛАТНО</h5>
                                        </a>
                                    </div>
                                    <div class="tri-item">
                                        <a href="design.html">
                                            <img src="images/des.png">
                                            <h5>3D Дизайн - БЕСПЛАТНО</h5>
                                        </a>
                                    </div>
                                </div>
                                <!--<a href="zont_pritochnyi.html">-->

                                <button id="fly" class="product_cart_button fly viewList_product_card add_item btn btn-large btn-primary" data-id="${
                                  a.code
                                }" data-title="<a href='${a.link}'>${
      a.title
    }</a>" data-price="${a.price}" data-quantity="1" data-img="${a.img}">
                                    <img class="basket" src="">&nbsp; В корзину
                                </button>
                                
                                <!--<button class="product_cart_button" tabindex="0">В корзину</button>-->
                                
                                <!--</a>-->
                            </div>
                        </div>
                    </a>
                            `;
        blockViewUl.appendChild(item);
    });
}

let searchArray = JSON.parse(localStorage.getItem("searched-cards") || "[]");
let searchedWord = JSON.parse(localStorage.getItem("searched-word"));

const sWord = document.getElementById("searched-word");
sWord.innerHTML = `${searchedWord}`;

searchArray.sort(function(a, b) {
    let x = parseInt(a.price, 10);
    let y = parseInt(b.price, 10);

    return x - y;
});

displayList(searchArray);