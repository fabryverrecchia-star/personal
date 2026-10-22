<?php
/**
 * Post in a list (blog, archive, search).
 *
 * @package Orbe
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry-card' ); ?> data-reveal>
	<a class="entry-card__link" href="<?php the_permalink(); ?>">
		<?php if ( has_post_thumbnail() ) : ?>
			<div class="entry-card__media"><?php the_post_thumbnail( 'orbe-card', array( 'alt' => '' ) ); ?></div>
		<?php endif; ?>
		<div class="entry-card__body">
			<?php the_title( '<h2 class="entry-card__title">', '</h2>' ); ?>
			<div class="entry-card__meta label"><?php echo esc_html( get_the_date() ); ?></div>
			<div class="entry-card__excerpt"><?php the_excerpt(); ?></div>
		</div>
	</a>
</article>
