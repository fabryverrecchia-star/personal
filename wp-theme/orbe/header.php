<?php
/**
 * Header: preloader, site bar and navigation.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

$orbe_nav_style = orbe_opt( 'nav_style' );
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'orbe' ); ?></a>

<?php if ( orbe_opt( 'preloader' ) ) : ?>
	<div class="preloader" data-preloader aria-hidden="true">
		<span class="preloader__name"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
		<span class="preloader__count" data-preloader-count>0</span>
	</div>
<?php endif; ?>

<?php if ( orbe_opt( 'page_transitions' ) ) : ?>
	<div class="curtain" data-curtain aria-hidden="true"></div>
<?php endif; ?>

<?php if ( orbe_opt( 'work_webgl' ) ) : ?>
	<div class="gl-layer" data-gl-root aria-hidden="true"></div>
<?php endif; ?>

<header class="site-header" data-header>
	<div class="site-header__inner container">
		<?php orbe_brand(); ?>

		<?php if ( 'inline' === $orbe_nav_style ) : ?>
			<nav class="nav-inline" aria-label="<?php esc_attr_e( 'Primary', 'orbe' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'menu_class'     => 'nav-inline__list',
						'container'      => false,
						'depth'          => 2,
						'fallback_cb'    => 'orbe_menu_fallback',
					)
				);
				?>
			</nav>
		<?php else : ?>
			<button type="button" class="menu-toggle link" data-menu-toggle aria-expanded="false" aria-controls="site-nav">
				<span class="menu-toggle__open"><?php esc_html_e( 'Menu', 'orbe' ); ?></span>
				<span class="menu-toggle__close" aria-hidden="true"><?php esc_html_e( 'Close', 'orbe' ); ?></span>
			</button>
		<?php endif; ?>
	</div>
</header>

<?php if ( 'inline' !== $orbe_nav_style ) : ?>
	<div class="nav-overlay" id="site-nav" data-nav hidden>
		<?php if ( 'webgl' === $orbe_nav_style ) : ?>
			<div class="nav-overlay__gl" data-nav-gl aria-hidden="true"></div>
		<?php endif; ?>
		<nav class="nav-overlay__inner container" aria-label="<?php esc_attr_e( 'Primary', 'orbe' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'menu_class'     => 'nav__list',
					'container'      => false,
					'depth'          => 1,
					'fallback_cb'    => 'orbe_menu_fallback',
				)
			);
			?>
			<div class="nav-overlay__aside">
				<?php if ( orbe_opt( 'footer_email' ) ) : ?>
					<a class="link" href="<?php echo esc_url( 'mailto:' . antispambot( orbe_opt( 'footer_email' ) ) ); ?>"><?php echo esc_html( antispambot( orbe_opt( 'footer_email' ) ) ); ?></a>
				<?php endif; ?>
				<ul class="socials">
					<?php foreach ( orbe_social_links() as $orbe_link ) : ?>
						<li><a class="link" href="<?php echo esc_url( $orbe_link['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $orbe_link['label'] ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</nav>
	</div>
<?php endif; ?>

<?php if ( orbe_opt( 'custom_cursor' ) ) : ?>
	<div class="cursor" data-cursor-el aria-hidden="true"><span class="cursor__label" data-cursor-label></span></div>
<?php endif; ?>

<main id="content" class="site-main">
