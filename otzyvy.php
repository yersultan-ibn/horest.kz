<!DOCTYPE html>
<html lang="en">
<?php
$time=time();
if (session_id()=='') session_start();

$db=mysqli_connect("localhost","v_20478_Gulbanu","dala3940","v_20478_metal") or die();
$res=mysqli_query($db,"set names utf8");

$mess_url=mysqli_real_escape_string($db,basename($_SERVER['SCRIPT_FILENAME']));

//получаем id текущей темы
$res=mysqli_query($db,"SELECT id FROM таблица WHERE file_name='".$mess_url."'");
$res=mysqli_fetch_array($res);
$theme_id=$res["id"];
$secret = '6Lfm4fUiAAAAAL4e-4xQ75CKMdD_W9J9npGi22-f';                       
//get verify response data
$verify = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$secret.'&response='.$_POST['g-recaptcha-response']);
$respponse = json_decode($verify);

//your site secret key


if ($respponse->success){    //отправлен комментарий
 $mess_login=htmlspecialchars($_POST["mess_login"]);
 $user_text=htmlspecialchars($_POST["user_text"]);
 $rating=htmlspecialchars($_POST["rating"]);
 $city_text=htmlspecialchars($_POST["city_text"]);

  if ($mess_login!='' and $user_text!=''){
   if (is_numeric($_POST["parent_id"]) and is_numeric($_POST["f_parent"]))
    $res=mysqli_query($db,"insert into horest
    (parent_id, first_parent, date, theme_id, login, message, rating, city)
    values ('".$_POST["parent_id"]."','".$_POST["f_parent"]."',
    '".$time."','".$theme_id."','".$mess_login."','".$user_text."','".$rating."','".$city_text."')");
   else $res=mysqli_query($db,"insert into horest (date, theme_id, login, message, rating, city)
   values ('".$time."','".$theme_id."','".$mess_login."','".$user_text."','".$rating."','".$city_text."')");
    $_SESSION["send"]="Комментарий принят!";
    header("Location: $mess_url#last"); exit;
  }
  else {
   $_SESSION["send"]="Не все поля заполнены!";
   header("Location: $mess_url#last"); exit;
  }

}

if (isset($_SESSION["send"]) and $_SESSION["send"]!="") {    //вывод сообщения
    echo '<script type="text/javascript">alert("'.$_SESSION["send"].'");</script>';
    $_SESSION["send"]="";
}
?>

<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VQ30WFJ5YD"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-VQ30WFJ5YD');
</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NDX4NCS');</script>
<!-- End Google Tag Manager -->
    <title>Отзывы о компании Horest. Профессиональное оборудование для общепита. Тепловое оборудование, Холодильное
        оборудование для общепита, Салат бары, Линии раздачи, Нейтральное оборудование</title>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <link rel="shortcut icon" href="images/Icon.ico" type="image/x-icon">
    <meta name="keywords" content="Horest, контакты horest, horest.kz, мынбаева 43">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

    <link rel="stylesheet" type="text/css" href="styles/bootstrap4/bootstrap.min.css">
    <link href="plugins/fontawesome-free-5.0.1/css/fontawesome-all.css" rel="stylesheet" type="text/css">
    <link rel="stylesheet" type="text/css" href="plugins/OwlCarousel2-2.2.1/owl.carousel.css">
    <link rel="stylesheet" type="text/css" href="plugins/OwlCarousel2-2.2.1/owl.theme.default.css">
    <link rel="stylesheet" type="text/css" href="plugins/OwlCarousel2-2.2.1/animate.css">
    <link rel="stylesheet" type="text/css" href="plugins/slick-1.8.0/slick.css">

    <link rel="stylesheet" type="text/css" href="styles/main_styles.css">
    <link rel="stylesheet" type="text/css" href="styles/jqcart.css">
    <link rel="stylesheet" type="text/css" href="styles/basket_notification.css">


    <link rel="stylesheet" type="text/css" href="styles/responsive.css">

    <link rel="stylesheet" type="text/css" href="plugins/slick-1.8.1/slick/slick.css" />
    <link rel="stylesheet" type="text/css" href="plugins/slick-1.8.1/slick/slick-theme.css" />
    <link rel="stylesheet" type="text/css" href="styles/icons.css">
</head>

<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NDX4NCS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
    

    <div class="super_container">
    </div>


    <div class="row main_row_container">
        <div class="col-lg-3">
            <!---Каталог--->
            <div class="shop_sidebar">
                <div class="sidebar_section">
                    <div class="sidebar_title">Каталог</div>
                    <ul class="sidebar_categories">
                        <li><a href="teplovoe.html"><span>&#9658;</span>Тепловое оборудование</a></li>
                        <li><a href="salat_bary.html"><span>&#9658;</span>Салат бары</a></li>
                        <li><a href="linii_razdachi.html"><span>&#9658;</span>Линии раздачи</a></li>
                        <li><a href="neutral.html"><span>&#9658;</span>Нейтральное оборудование</a></li>
                        <li><a href="zont.html"><span>&#9658;</span>Вентиляционные зонты</a></li>
                        <li><a href="holod.html"><span>&#9658;</span>Холодильное оборудование</a></li>
                        <li><a href="container.html"><span>&#9658;</span>Гастроемкости</a></li>
                        <li><a href="mixer.html"><span>&#9658;</span>Миксеры, блендеры</a></li>
                    </ul>
                </div>
            </div>
            <div class="shop_sidebar">
                <div class="sidebar_section">
                    <div class="sidebar_title">Контакты</div>
                    <p><b>г. Алматы</b>
                        <br>ул. Мынбаева 43
                        <br>(уг. ул. между Ауезова и Манаса),
                        <br>1-этаж, 050008
                        <br>8 (727) 344-99-00
                        <br>+7 (701) 266-77-00

                        <br>Email: zakaz@idiamarket.kz
                    </p>
                    <p><b>г. Астана</b><br>ул. Бейсекбаева 24/1<br>2-этаж, бизнес центр DARA<br>8 (7172)
                        27-99-00<br>+7 (701) 511-22-00<br>Email: astana@idiamarket.kz</p>
                </div>
            </div>
        </div>
        <div class="col-lg-9">
            <div class="product_name1">Отзывы</div>
            <hr>
            <div class="contact_info">

                <div class="row row-otzyvy">
                    <?php
function parents($up=0, $left=0) {    //Строим иерархическое дерево комментариев
global $tag,$mess_url;

    for ($i=0; $i<=count($tag[$up])-1; $i++) {
    //Можно выделять цветом указанные логины
        if ($tag[$up][$i][2]=='Admin') $tag[$up][$i][2]='<font color="#C00">Admin</font>';
        if ($tag[$up][$i][6]==0) $tag[$up][$i][6]=$tag[$up][$i][0];
        //Высчитываем рейтинг комментария
        $sum=$tag[$up][$i][4]-$tag[$up][$i][5];

        if ($up==0) echo '<div class="otz_items" style=" color: #2a4f5e; border-bottom: 1px solid #e6e6ec; padding-bottom:10px; float:none!important;">';
        else {
            if (count($tag[$up])-1!=$i)
                echo '<div class="strelka" style="padding:5px 0 0 '.($left-2).'px;">';
            else echo '<div class="strelka_2" style="padding:5px 0 0 '.$left.'px;">';
        }
        echo '<div class="comm_head" id="m'.$tag[$up][$i][0].'">';
        echo '<div class="name_city_parent" style="float:left; margin-right:5px; font-size:16px!important; color:#2a4f5e;"> <div class="name_city"> Имя: </div> <b>'.$tag[$up][$i][4].' </b></div>';
        echo '<div style="text-align:right; float:none">  '.date("d.m.Y в H:i ", $tag[$up][$i][5]).'</div></div>';
        
		echo '<div class="city-rating" style="float:left; margin-right:5px; font-size:16px!important; color:#2a4f5e;"> 
		<div class="name_city_parent"><div class="name_city"> Город: </div> <b>'.$tag[$up][$i][3].'</b></div>';
		

		echo '<div class="city-name-ds">';
        echo '<div style="float:none; display:none;"> '.$tag[$up][$i][2].' </div>';
        if ($tag[$up][$i][2]==5) echo '<img src="/images/otzovy/five.png">';
        elseif ($tag[$up][$i][2]==4){
            echo '<img src="/images/otzovy/four.png">';
        }
        elseif ($tag[$up][$i][2]==3) {
            echo '<img src="/images/otzovy/three.png">';
        }
        elseif ($tag[$up][$i][2]==2) {
            echo '<img src="/images/otzovy/two.png">';
        }
        else echo '<img src="/images/otzovy/one.png">';
        echo '</div></div>';
        

		echo '<div class="comm_body"  style="float:none!important; margin:15px 0 20px 0;">';
        echo '<div style="word-wrap:break-word; float:none!important;">';
        echo str_replace("<br />","<br>",nl2br($tag[$up][$i][1])).'</div>';

		if (isset($tag[ $tag[$up][$i][0] ])) parents($tag[$up][$i][0],20);
        echo '</div></div>';
    }
}

$res=mysqli_query($db,"SELECT * FROM horest
    WHERE theme_id='".$theme_id."' ORDER BY id");
$number=mysqli_num_rows($res);

if ($number>0) {
 echo '<div>';
 while ($com=mysqli_fetch_assoc($res))
    $tag[(int)$com["parent_id"]][] = array((int)$com["id"], $com["message"], $com["rating"], $com["city"], 
    $com["login"], $com["date"], $com["plus"], $com["minus"], $com["first_parent"]);
 echo parents().'</div><br>';
}
?>
                    <?php
$cod=rand(100,900); $cod2=rand(10,99);
echo '<div id="last" class="ostavit-otzov">
<div class="ostavit-otzov-child">
	<form method="POST" action="'.$mess_url.'#last" class="add_comment">
		<div class="ostavit-otzov-child-h3">
			<h3>Оставить отзыв</h3>
		</div>
		<div class="ostavit-otzov-child-textBlock">
            <div class="rating1">
                    <div class="rating1-child"> Ваша оценка:
                        <span class="starRating">	
                            <input id="rating5" type="radio" name="rating" value="5" checked="">
                            <label for="rating5">5</label>
                            <input id="rating4" type="radio" name="rating" value="4">
                            <label for="rating4">4</label>
                            <input id="rating3" type="radio" name="rating" value="3">
                            <label for="rating3">3</label>
                            <input id="rating2" type="radio" name="rating" value="2">
                            <label for="rating2">2</label>
                            <input id="rating1" type="radio" name="rating" value="1">
                            <label for="rating1">1</label>
                        </span>
                    </div>
			</div>
			<div class="ostavit-otzov-child-textBlock-textName">
				<div class="otzov-text-leftBlock">Имя:</div>
				<input class="otzov-textarea" type="text" name="mess_login" maxlength="20" value="">
			</div>
			<div class="ostavit-otzov-child-textBlock-textCity">
				<div class="otzov-text-leftBlock">Город:</div>

				<div class="dropdown">
					<select name="city_text" class="dropdown-select">
					<option value="Алматы" selected="selected">Алматы</option>
					<option value="Астана">Астана</option>
					<option value="Актау">Актау</option>
					<option value="Актобе">Актобе</option>
					<option value="Атырау">Атырау</option>
					<option value="Жанаозен">Жанаозен</option>
					<option value="Жезказган">Жезказган</option>
					<option value="Караганда">Караганда</option>
					<option value="Кокшетау">Кокшетау</option>
					<option value="Костанай">Костанай</option>
					<option value="Кызылорда">Кызылорда</option>
					<option value="Павлодар">Павлодар</option>
					<option value="Петропавловск">Петропавловск</option>
					<option value="Семей">Семей</option>
					<option value="Талдыкорган">Талдыкорган</option>
					<option value="Тараз">Тараз</option>
					<option value="Туркестан">Туркестан</option>
					<option value="Уральск">Уральск</option>
					<option value="Усть-Каменогорск">Усть-Каменогорск</option>
					<option value="Шымкент">Шымкент</option>
				</select>
				</div>

			</div>
			<div class="ostavit-otzov-child-textBlock-textOtzov">
				<div class="otzov-text-leftBlock">Отзыв:</div>
				<textarea class="otzov-textarea" name="user_text" cols="50" rows="5"></textarea>
			</div>

			

			<style>
				iframe {
					height: 80px;
				}
			</style>

			<div class="captcha">
				<div class="g-recaptcha" data-sitekey="6Lfm4fUiAAAAAFhVKZaebdfKEbvq3WuNvmQhcRg3"></div>
			</div>

			<div class="submit-otzov">
				<input class="knopka" type="submit" value="Отправить">
			</div>
			

		</div>
	</form>
</div>
</div>'
?>
                </div>
            </div>
        </div>



        <div class="carosel-root">
            <div class="carosel">
                <div class="carosel-item item-1">
                    <img src="img/slides/kingfisher.webp" alt="">
                </div>
                <div class="carosel-item item-2">
                    <img src="img/slides/naz.webp" alt="">
                </div>
                <div class="carosel-item item-3">
                    <img src="img/slides/mechta.webp" alt="">
                </div>
                <div class="carosel-item item-4">
                    <img src="img/slides/беккер.webp" alt="">
                </div>
                <div class="carosel-item item-5">
                    <img src="img/slides/biskvit.webp" alt="">
                </div>
                <div class="carosel-item item-5">
                    <img src="img/slides/JLC.webp" alt="">
                </div>
            </div>

            <button type="button" class="carosel-nav carosel-nav-left">&lt;</button>
            <button type="button" class="carosel-nav carosel-nav-right">&gt;</button>
        </div>



    </div>
    <footer class="footer">
        <div class="container">
            <div class="row">

                <div class="footer_col">
                    <div class="footer_column footer_contact">
                        <div class="logo_container">
                            <div class="logo"><a href="index.html"><img src="images/logo.png"></a></div>
                        </div>

                        <div class="footer_phone">8 (727) 344 99 00</div>
                        <div class="footer_contact_text">
                            <p>г. Алматы, ул. Мынбаева 43 (уг.ул. Манаса),</p>
                            <p>1-этаж, 050008</p>
                        </div>
                    </div>
                </div>

                <div class="col-lg-2 offset-lg-2">
                    <div class="footer_column">
                        <div class="footer_subtitle"><a href="index.html" style="color:#828282;">Главная</a></div>
                        <ul class="footer_list">


                            <li><a href="design.html">3D Дизайн</a></li>
                            <li><a href="delivery.html">Доставка</a></li>
                            <li><a href="about.html">О нас</a></li>
                            <li><a href="otzyvy.php">Отзывы</a></li>
                            <li><a href="contact.html">Контакты</a></li>
                        </ul>

                    </div>
                </div>

                <div class="col-lg-2 offset-lg-2">

                    <div class="footer_column">
                        <div class="footer_subtitle"><a href="catalog.html" style="color:#828282;">Каталог</a></div>
                        <ul class="footer_list">
                                <li>
                                    <a href="teplovoe.html">Тепловое оборудование</a>
                                </li>
                                 <li>
                                    <a href="hlebopekarnoe_oborudovanie.html">Хлебопекарное, кондитерское оборудование</a>
                                </li>
                                <li>
                                    <a href="mixer.html">Электромеханическое оборудование</a>
                                </li>
                                <li>
                                    <a href="salat_bary.html">Салат бары</a>
                                </li>
                                <li>
                                    <a href="linii_razdachi.html">Линии раздачи</a>
                                </li>
                                <li>
                                    <a href="neutral.html">Нейтральное оборудование</a>
                                </li>
                                <li>
                                    <a href="zont.html">Вентиляционные зонты</a>
                                </li>
                                <li>
                                    <a href="holod.html">Холодильные оборудования</a>
                                </li>
                                <li>
                                    <a href="posud_oborudovanie.html">Посудомоечное оборудование</a>
                                </li>
                        </ul>
                    </div>
                </div>

            </div>
            <p style="text-align:center; margin-top:2em">&copy 2010-2021 Horest</p>
        </div>
    </footer>



    <script src="js/jquery-3.3.1.min.js"></script>
    <script src="styles/bootstrap4/popper.js"></script>
    <script src="styles/bootstrap4/bootstrap.min.js"></script>
    <script src="plugins/greensock/TweenMax.min.js"></script>
    <script src="plugins/greensock/TimelineMax.min.js"></script>
    <script src="plugins/scrollmagic/ScrollMagic.min.js"></script>
    <script src="plugins/greensock/animation.gsap.min.js"></script>
    <script src="plugins/greensock/ScrollToPlugin.min.js"></script>
    <script src="plugins/OwlCarousel2-2.2.1/owl.carousel.js"></script>
    <script src="plugins/slick-1.8.0/slick.js"></script>
    <script src="plugins/easing/easing.js"></script>

    <!-- Подключаем слайдер Slick -->
    <script src="js/slick.min.js"></script>
    <!-- Подключаем файл скриптов -->


    <script src="js/custom.js"></script>
        <script src="js/smart-search.js"></script>
<script src="js/jqcart.min.js"></script>
    <script src="js/jquery.maskedinput.min.js"></script>
    <script src="js/basket_notification.js"></script>
</body>

</html>