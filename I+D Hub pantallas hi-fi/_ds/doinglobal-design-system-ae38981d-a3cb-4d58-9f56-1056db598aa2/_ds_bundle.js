/* @ds-bundle: {"format":3,"namespace":"DoinGlobalDesignSystem_ae3898","components":[],"sourceHashes":{"ui_kits/website/Button.jsx":"fec7c80de761","ui_kits/website/Header.jsx":"90d30c842b8b","ui_kits/website/Hero.jsx":"34e12f5051c1","ui_kits/website/ProgramCard.jsx":"e0387cc4437f","ui_kits/website/Sections.jsx":"5e2ff6a59ba6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DoinGlobalDesignSystem_ae3898 = window.DoinGlobalDesignSystem_ae3898 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/website/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Shared button component
function Button({
  variant = 'primary',
  size,
  children,
  onClick,
  ...rest
}) {
  const cls = ['dg-btn', `dg-btn--${variant}`, size === 'lg' ? 'dg-btn--lg' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    onClick: onClick
  }, rest), children);
}
window.Button = Button;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Button.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
function Header({
  onNav,
  active = 'programas'
}) {
  const items = [{
    id: 'programas',
    label: 'Programas'
  }, {
    id: 'alianzas',
    label: 'Alianzas'
  }, {
    id: 'metodologia',
    label: 'Metodología'
  }, {
    id: 'empresas',
    label: 'Empresas'
  }, {
    id: 'contacto',
    label: 'Contacto'
  }];
  return /*#__PURE__*/React.createElement("header", {
    className: "dg-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-header__inner"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav && onNav('home');
    }
  }, /*#__PURE__*/React.createElement("img", {
    className: "dg-header__logo",
    src: "../../assets/logo-primary.png",
    alt: "doinGlobal"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "dg-nav"
  }, items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i.id,
    href: "#",
    className: active === i.id ? 'active' : '',
    onClick: e => {
      e.preventDefault();
      onNav && onNav(i.id);
    }
  }, i.label))), /*#__PURE__*/React.createElement("div", {
    className: "dg-header__actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => onNav && onNav('login')
  }, "Ingresar"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => onNav && onNav('enroll')
  }, "Inscr\xEDbete"))));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
function Hero({
  eyebrow,
  title,
  desc,
  bg,
  primaryCta,
  secondaryCta,
  onPrimary,
  onSecondary
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "dg-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-hero__bg",
    style: {
      backgroundImage: `url(${bg})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "dg-hero__overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "dg-hero__content"
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "dg-hero__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    className: "dg-hero__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "dg-hero__desc"
  }, desc), /*#__PURE__*/React.createElement("div", {
    className: "dg-hero__actions"
  }, primaryCta && /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onPrimary
  }, primaryCta), secondaryCta && /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    size: "lg",
    onClick: onSecondary
  }, secondaryCta))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ProgramCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgramCard({
  tag,
  eyebrow,
  title,
  duration,
  mode,
  partner,
  image,
  onClick
}) {
  return /*#__PURE__*/React.createElement("article", {
    className: "dg-pcard",
    onClick: onClick,
    style: {
      cursor: onClick ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-pcard__cover",
    style: {
      backgroundImage: image ? `url(${image})` : undefined
    }
  }, tag && /*#__PURE__*/React.createElement("span", {
    className: "dg-pcard__tag"
  }, tag)), /*#__PURE__*/React.createElement("div", {
    className: "dg-pcard__body"
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "dg-pcard__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    className: "dg-pcard__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "dg-pcard__meta"
  }, duration && /*#__PURE__*/React.createElement("span", null, "\u23F1 ", duration), mode && /*#__PURE__*/React.createElement("span", null, "\u2B21 ", mode)), /*#__PURE__*/React.createElement("div", {
    className: "dg-pcard__footer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dg-pcard__price"
  }, partner || '\u00A0'), /*#__PURE__*/React.createElement("a", {
    className: "dg-pcard__link",
    href: "#",
    onClick: e => e.preventDefault()
  }, "Ver programa \u2192"))));
}
function ProgramGrid({
  programs,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dg-programs"
  }, programs.map((p, i) => /*#__PURE__*/React.createElement(ProgramCard, _extends({
    key: i
  }, p, {
    onClick: () => onSelect && onSelect(p)
  }))));
}
window.ProgramCard = ProgramCard;
window.ProgramGrid = ProgramGrid;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ProgramCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Sections.jsx
try { (() => {
function PartnerStrip({
  partners
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dg-partners"
  }, partners.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "dg-partner"
  }, p)));
}
function StatsBand({
  stats
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dg-stats"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-stat__num"
  }, s.num), /*#__PURE__*/React.createElement("div", {
    className: "dg-stat__label"
  }, s.label))));
}
function FeatureRow({
  eyebrow,
  title,
  desc,
  bullets,
  image,
  reverse,
  cta,
  onCta
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `dg-feature ${reverse ? 'dg-feature--reverse' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-feature__img",
    style: {
      backgroundImage: image ? `url(${image})` : undefined
    }
  }), /*#__PURE__*/React.createElement("div", null, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "dg-section__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    className: "dg-feature__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "dg-feature__desc"
  }, desc), bullets && /*#__PURE__*/React.createElement("ul", {
    className: "dg-feature__list"
  }, bullets.map((b, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("svg", {
    className: "dg-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })), /*#__PURE__*/React.createElement("span", null, b)))), cta && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onCta
  }, cta)));
}
function Testimonial({
  text,
  name,
  role,
  avatar
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "dg-quote"
  }, /*#__PURE__*/React.createElement("p", {
    className: "dg-quote__text"
  }, "\"", text, "\""), /*#__PURE__*/React.createElement("div", {
    className: "dg-quote__author"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-quote__avatar",
    style: {
      backgroundImage: avatar ? `url(${avatar})` : undefined
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "dg-quote__name"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "dg-quote__role"
  }, role))));
}
function CTASection({
  title,
  desc,
  primary,
  secondary,
  onPrimary,
  onSecondary,
  bg
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "dg-cta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-cta__bg",
    style: bg ? {
      backgroundImage: `url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : undefined
  }), /*#__PURE__*/React.createElement("div", {
    className: "dg-cta__overlay"
  }), /*#__PURE__*/React.createElement("div", {
    className: "dg-cta__content"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "dg-cta__title"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "dg-cta__desc"
  }, desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, primary && /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onPrimary
  }, primary), secondary && /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    size: "lg",
    onClick: onSecondary
  }, secondary))));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "dg-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-white.png",
    alt: "doinGlobal"
  }), /*#__PURE__*/React.createElement("p", {
    className: "dg-footer__about"
  }, "Formaci\xF3n profesional 100% online. MBA, maestr\xEDas y certificaciones con alcance global y alianzas estrat\xE9gicas en Iberoam\xE9rica y Europa.")), /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__col"
  }, /*#__PURE__*/React.createElement("h4", null, "Programas"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "MBA")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Maestr\xEDas")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Certificaciones")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Empresas")))), /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__col"
  }, /*#__PURE__*/React.createElement("h4", null, "Instituci\xF3n"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Qui\xE9nes somos")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Alianzas")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Metodolog\xEDa")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Prensa")))), /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__col"
  }, /*#__PURE__*/React.createElement("h4", null, "Soporte"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Centro de ayuda")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Contacto")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Legal")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Privacidad"))))), /*#__PURE__*/React.createElement("div", {
    className: "dg-footer__bottom"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 doinGlobal. Todos los derechos reservados."), /*#__PURE__*/React.createElement("span", null, "doinglobal.com")));
}
window.PartnerStrip = PartnerStrip;
window.StatsBand = StatsBand;
window.FeatureRow = FeatureRow;
window.Testimonial = Testimonial;
window.CTASection = CTASection;
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Sections.jsx", error: String((e && e.message) || e) }); }

})();
