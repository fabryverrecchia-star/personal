<?php
/**
 * Page.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry' ); ?>>
		<?php
		get_template_part(
			'template-parts/page-header',
			null,
			array(
				'title' => get_the_title(),
				'intro' => has_excerpt() ? get_the_excerpt() : '',
			)
		);
		?>
		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="entry__media container" data-reveal="media"><?php the_post_thumbnail( 'orbe-hero' ); ?></figure>
		<?php endif; ?>
		<div class="entry-content container">
			<?php
			the_content();
			wp_link_pages();
			?>
		</div>
		<?php
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
		?>
	</article>
	<?php
endwhile;

get_footer();
