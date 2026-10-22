<?php
/**
 * Front page: WebGL hero, projects grid, then the page content (static front page).
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

if ( orbe_opt( 'hero_enable' ) ) {
	get_template_part( 'template-parts/hero' );
}

get_template_part( 'template-parts/work-grid', null, array( 'query' => orbe_work_query( absint( orbe_opt( 'work_count' ) ) ) ) );

if ( 'page' === get_option( 'show_on_front' ) ) {
	while ( have_posts() ) :
		the_post();
		if ( '' !== trim( get_the_content() ) ) :
			?>
			<div class="entry-content container"><?php the_content(); ?></div>
			<?php
		endif;
	endwhile;
}

get_footer();
