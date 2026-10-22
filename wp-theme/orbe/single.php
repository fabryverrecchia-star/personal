<?php
/**
 * Single post.
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry' ); ?>>
		<header class="entry__header container">
			<p class="label" data-reveal><?php orbe_posted_on(); ?></p>
			<?php the_title( '<h1 class="entry__title display" data-reveal="lines">', '</h1>' ); ?>
		</header>
		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="entry__media container" data-reveal="media"><?php the_post_thumbnail( 'orbe-hero' ); ?></figure>
		<?php endif; ?>
		<div class="entry-content container">
			<?php
			the_content();
			wp_link_pages();
			?>
		</div>
		<footer class="entry__footer container">
			<?php the_tags( '<p class="entry__tags label">', ', ', '</p>' ); ?>
			<?php
			the_post_navigation(
				array(
					'prev_text' => '<span class="label">' . esc_html__( 'Previous', 'orbe' ) . '</span> %title',
					'next_text' => '<span class="label">' . esc_html__( 'Next', 'orbe' ) . '</span> %title',
				)
			);
			?>
		</footer>
		<?php
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
		?>
	</article>
	<?php
endwhile;

get_footer();
