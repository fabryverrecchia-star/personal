"""Correctifs ponctuels : formulations du contrat, script des récits épinglés."""
import pathlib
here = pathlib.Path(__file__).resolve().parent

p = here / '_body.html'
s = p.read_text()
s = s.replace(
    "<p>Le domaine est géré par l’intermédiaire du prestataire, qui peut s’opposer à un transfert en cas de litige.</p>",
    "<p>Le domaine est géré par l’intermédiaire du prestataire, qui se réserve le droit de s’opposer à son transfert s’il reste une somme due.</p>")
s = s.replace(
    "<p>Les conditions actuelles prévoient que le code reste la propriété du prestataire.</p>",
    "<p>Les conditions générales jointes à l’offre de votre prestataire prévoient que le code ne peut être ni vendu ni divulgué.</p>")
s = s.replace(
    "<p>L’hébergement actuel se renouvelle chaque année par tacite reconduction. La résiliation se notifie trois mois avant l’échéance, par lettre recommandée.</p>",
    "<p>D’après ces mêmes conditions, l’hébergement se renouvelle chaque année par tacite reconduction, et se résilie trois mois avant l’échéance par lettre recommandée.</p>")
p.write_text(s)

p = here / '_tail.html'
s = p.read_text()
start = s.index("  $$('[data-story]').forEach(function (story) {")
end = s.index("  // Démo store locator")
new = """  $$('[data-story]').forEach(function (story) {
    var stage = $('.stage', story);
    var imgs = $$('[data-frame] img', story);
    var pimgs = $$('[data-phone] img', story);
    stage.classList.add('has-js');
    function show(i) {
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      pimgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    }
    show(0);
    var steps = $$('.step', story);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        steps.forEach(function (st) { st.classList.toggle('is-on', st === e.target); });
        show(parseInt(e.target.getAttribute('data-show'), 10) || 0);
      });
    }, { rootMargin: '-40% 0px -45% 0px' });
    steps.forEach(function (st) { io.observe(st); });
    steps[0].classList.add('is-on');
  });

"""
s = s[:start] + new + s[end:]
p.write_text(s)
print('ok')
