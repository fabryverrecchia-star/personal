<?php
/**
 * Fallback template: blog index and archives.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

if ( is_home() && ! is_front_page() ) {
	$orbe_title = single_post_title( '', false );
} elseif ( is_search() ) {
	/* translators: %s: search query. */
	$orbe_title = sprintf( esc_html__( 'Results for “%s”', 'orbe' ), esc_html( get_search_query() ) );
} elseif ( is_archive() ) {
	$orbe_title = get_the_archive_title();
} else {
	$orbe_title = esc_html__( 'Journal', 'orbe' );
}

get_template_part(
	'template-parts/page-header',
	null,
	array(
		'title' => $orbe_title,
		'intro' => is_archive() ? get_the_archive_description() : '',
	)
);
?>
<div class="posts container">
	<?php
	if ( have_posts() ) :
		while ( have_posts() ) :
			the_post();
			get_template_part( 'template-parts/content', get_post_type() );
		endwhile;
		the_posts_pagination(
			array(
				'prev_text' => esc_html__( 'Previous', 'orbe' ),
				'next_text' => esc_html__( 'Next', 'orbe' ),
			)
		);
	else :
		get_template_part( 'template-parts/content', 'none' );
	endif;
	?>
</div>
<?php
get_footer();
