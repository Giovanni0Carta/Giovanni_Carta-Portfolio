const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const progressBar = document.querySelector('.scroll-progress span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const closeMenu = () => {
  if (!menuButton || !navLinks) return;
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
};

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  });

  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) closeMenu();
  });
}

let scrollTicking = false;
const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  header?.classList.toggle('scrolled', scrollTop > 24);
  if (progressBar) {
    const progress = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }
  scrollTicking = false;
};

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollUI);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollUI();

const revealElements = document.querySelectorAll('.reveal');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => {
    element.classList.add('visible');
    if (element.matches('.timeline-item')) element.classList.add('timeline-item-visible');
    if (element.matches('.ace-insight-row')) element.classList.add('ace-insight-visible');
  });
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      if (entry.target.matches('.timeline-item')) entry.target.classList.add('timeline-item-visible');
      if (entry.target.matches('.ace-insight-row')) entry.target.classList.add('ace-insight-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
  revealElements.forEach(element => revealObserver.observe(element));
}

const formatCounter = (element, value) => {
  if (element.dataset.countFormat === 'millions-3') {
    return `${(value / 1000000).toFixed(3)}M`;
  }
  const suffix = element.dataset.countSuffix ?? (Number(element.dataset.count) === 50 ? '+' : '');
  return `${Math.round(value).toLocaleString('en-US')}${suffix}`;
};

const counters = document.querySelectorAll('[data-count]');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  counters.forEach(element => {
    element.textContent = formatCounter(element, Number(element.dataset.count));
  });
} else {
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.count);
      const start = performance.now();
      // Ace uses denser evidence cards: a slower, softer count keeps the
      // change legible instead of making the values jump into view.
      const isAceCase = Boolean(element.closest('.ace-case-page'));
      const duration = isAceCase ? 2100 : 1100;

      const update = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = isAceCase
          ? 1 - Math.pow(1 - progress, 2)
          : 1 - Math.pow(1 - progress, 3);
        element.textContent = formatCounter(element, target * eased);
        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
      countObserver.unobserve(element);
    });
  }, { threshold: 0.65 });
  counters.forEach(element => countObserver.observe(element));
}

const narrativeSections = document.querySelectorAll('[data-narrative]');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  narrativeSections.forEach(section => section.classList.add('narrative-visible'));
} else {
  const narrativeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('narrative-visible');
      narrativeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -70px' });
  narrativeSections.forEach(section => narrativeObserver.observe(section));
}

const processJourneys = document.querySelectorAll('[data-process-journey]');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  processJourneys.forEach(journey => journey.classList.add('process-journey-visible'));
} else {
  const processJourneyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('process-journey-visible');
      processJourneyObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -50px' });
  processJourneys.forEach(journey => processJourneyObserver.observe(journey));
}

const finePointer = window.matchMedia('(pointer: fine)');

/* Draw the forecasting paths progressively while their card moves through view. */
const forecastVisual = document.querySelector('.projects-section .forecast-visual');
if (forecastVisual && !reducedMotion.matches) {
  const forecastPaths = [...forecastVisual.querySelectorAll('.chart-line')].map(path => ({
    path,
    length: path.getTotalLength()
  }));
  forecastPaths.forEach(({ path, length }) => {
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
  });

  let forecastFrame = null;
  const updateForecastPaths = () => {
    forecastFrame = null;
    const bounds = forecastVisual.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height * .28)));
    forecastPaths.forEach(({ path, length }, index) => {
      const delayedProgress = Math.max(0, Math.min(1, (progress - index * .08) / .92));
      path.style.strokeDashoffset = String(length * (1 - delayedProgress));
    });
  };
  const requestForecastUpdate = () => {
    if (!forecastFrame) forecastFrame = requestAnimationFrame(updateForecastPaths);
  };
  window.addEventListener('scroll', requestForecastUpdate, { passive: true });
  window.addEventListener('resize', requestForecastUpdate);
  requestForecastUpdate();
}

if (finePointer.matches && !reducedMotion.matches) {
  document.querySelectorAll('[data-tilt], .featured-project').forEach(card => {
    card.addEventListener('pointermove', event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  const glows = document.querySelectorAll('.page-glow');
  window.addEventListener('pointermove', event => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    glows.forEach((glow, index) => {
      const strength = index === 0 ? 18 : -12;
      glow.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    });
  }, { passive: true });
}

const sections = document.querySelectorAll('main section[id]');
const sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
if ('IntersectionObserver' in window && sections.length && sectionLinks.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-28% 0px -62%', threshold: 0 });
  sections.forEach(section => sectionObserver.observe(section));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const conjointLab = document.querySelector('[data-conjoint-lab]');
if (conjointLab) {
  const projectScenarios = {
    300: { share: '18.20%', revenue: '$546M' },
    350: { share: '13.40%', revenue: '$469M' },
    400: { share: '6.70%', revenue: '$268M' },
    450: { share: '3.60%', revenue: '$162M' }
  };
  const output = conjointLab.querySelector('output');
  conjointLab.querySelectorAll('[data-price]').forEach(button => {
    button.addEventListener('click', () => {
      const scenario = projectScenarios[button.dataset.price];
      conjointLab.querySelectorAll('[data-price]').forEach(item => item.classList.toggle('active', item === button));
      output.querySelector('b').textContent = scenario.share;
      output.querySelector('strong').textContent = scenario.revenue;
    });
  });
}

const scaleExplorer = document.querySelector('[data-scale-explorer]');
if (scaleExplorer) {
  const output = scaleExplorer.querySelector('output');
  const value = output.querySelector('b');
  const label = output.querySelector('span');
  const detail = output.querySelector('small');
  scaleExplorer.querySelectorAll('[data-scale-item]').forEach(item => {
    item.addEventListener('click', () => {
      scaleExplorer.querySelectorAll('[data-scale-item]').forEach(button => {
        const active = button === item;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      value.textContent = item.dataset.value;
      label.textContent = item.dataset.label;
      detail.textContent = item.dataset.detail;
    });
  });
}

const pharmaTabs = document.querySelector('[data-pharma-tabs]');
if (pharmaTabs) {
  const tabs = Array.from(pharmaTabs.querySelectorAll('[role="tab"]'));
  const panels = Array.from(pharmaTabs.querySelectorAll('[role="tabpanel"]'));
  const activateTab = tab => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      activateTab(tabs[next]);
    });
  });
}

const pharmaDax = document.querySelector('[data-pharma-dax]');
if (pharmaDax) {
  const measureFamilies = {
    sales: [
      {
        name: 'Net Sales',
        modelName: 'Total Sales',
        question: 'How much commercial value is represented in the selected context?',
        pages: 'Executive, Product, Sales Force',
        dependencies: 'FactSales[Sales]',
        formula: 'Total Sales = SUM(FactSales[Sales])'
      },
      {
        name: 'Net Quantity',
        modelName: 'Total Quantity',
        question: 'How much product volume is represented in the selected context?',
        pages: 'Executive, Product',
        dependencies: 'FactSales[Quantity]',
        formula: 'Total Quantity = SUM(FactSales[Quantity])'
      },
      {
        name: 'Average Selling Price',
        modelName: 'Average Selling Price',
        question: 'What is the average selling price across the selected transactions?',
        pages: 'Executive, Product',
        dependencies: '[Total Sales], [Total Quantity]',
        formula: 'Average Selling Price = [Total Sales]/[Total Quantity]'
      },
      {
        name: 'Transaction Count',
        modelName: 'Transaction Count',
        question: 'How many transactions contribute to the selected view?',
        pages: 'Executive',
        dependencies: 'FactSales',
        formula: 'Transaction Count = COUNTROWS(FactSales)'
      }
    ],
    growth: [
      {
        name: 'Sales Previous Year',
        modelName: 'Sales Previous Year',
        question: 'What was the comparable sales value in the previous year?',
        pages: 'Executive, Product, Sales Force',
        dependencies: '[Total Sales], DimDate[MonthStart]',
        formula: 'Sales Previous Year = CALCULATE([Total Sales],DATEADD(DimDate[MonthStart],-1,YEAR))'
      },
      {
        name: 'YoY Sales Growth %',
        modelName: 'YoY Sales Growth %',
        question: 'How has sales performance changed compared with the previous year?',
        pages: 'Executive, Product, Sales Force',
        dependencies: '[Total Sales], [Sales Previous Year]',
        formula: `YoY Sales Growth % =
DIVIDE(
    [Total Sales] - [Sales Previous Year],
    [Sales Previous Year]
)`
      }
    ],
    returns: [
      {
        name: 'Return Value',
        modelName: 'Return Value',
        question: 'What value is associated with returned products in the selected context?',
        pages: 'Sales Force & Returns',
        dependencies: 'FactSales[Sales]',
        formula: 'Return Value = CALCULATE(-SUM(FactSales[Sales]), FactSales[Sales]<0)'
      },
      {
        name: 'Return Rate %',
        modelName: 'Return Rate %',
        question: 'What proportion of the selected activity is represented by returns?',
        pages: 'Executive, Sales Force & Returns',
        dependencies: '[Return Value], [Total Sales]',
        formula: 'Return Rate % = DIVIDE([Return Value], [Return Value]+[Total Sales])'
      }
    ],
    portfolio: [
      {
        name: 'Portfolio Contribution %',
        modelName: 'Portfolio Contribution %',
        question: 'How much does the selected portfolio element contribute to the whole?',
        pages: 'Product & Market',
        dependencies: '[Total Sales], DimProduct[Product Name], DimProduct[Product Class]',
        formula: `Portfolio Contribution % =
SWITCH(
    TRUE(),

    ISINSCOPE(DimProduct[Product Name]),
        DIVIDE(
            [Total Sales],
            CALCULATE(
                [Total Sales],
                ALLSELECTED(DimProduct[Product Name])
            )
        ),

    ISINSCOPE(DimProduct[Product Class]),
        DIVIDE(
            [Total Sales],
            CALCULATE(
                [Total Sales],
                ALLSELECTED(DimProduct[Product Class])
            )
        ),

    1
)`
      },
      {
        name: 'Product Sales Contribution %',
        modelName: 'Product Sales Contribution %',
        question: 'How much does the selected product contribute to sales?',
        pages: 'Product & Market',
        dependencies: '[Total Sales], DimProduct[Product Name]',
        formula: `Product Sales Contribution % = DIVIDE([Total Sales],
CALCULATE([Total Sales],ALLSELECTED(DimProduct[Product Name])))`
      },
      {
        name: 'Product count',
        modelName: 'Product count',
        question: 'How many products are represented in the selected context?',
        pages: 'Product & Market',
        dependencies: 'DimProduct[Product Name]',
        formula: 'Product count = DISTINCTCOUNT(DimProduct[Product Name])'
      }
    ]
  };

  const familyTabs = Array.from(pharmaDax.querySelectorAll('[data-dax-family]'));
  const measureList = pharmaDax.querySelector('[data-dax-list]');
  const category = pharmaDax.querySelector('[data-dax-category]');
  const name = pharmaDax.querySelector('[data-dax-name]');
  const modelName = pharmaDax.querySelector('[data-dax-model]');
  const question = pharmaDax.querySelector('[data-dax-question]');
  const pages = pharmaDax.querySelector('[data-dax-pages]');
  const dependencies = pharmaDax.querySelector('[data-dax-dependencies]');
  const formula = pharmaDax.querySelector('[data-dax-formula]');

  const showMeasure = (measure, button) => {
    measureList.querySelectorAll('button').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    name.textContent = measure.name;
    modelName.textContent = measure.modelName;
    question.textContent = measure.question;
    pages.textContent = measure.pages;
    dependencies.textContent = measure.dependencies;
    formula.textContent = measure.formula;
  };

  const showFamily = tab => {
    const family = tab.dataset.daxFamily;
    const measures = measureFamilies[family];
    familyTabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    category.textContent = tab.textContent;
    measureList.replaceChildren();
    measures.forEach((measure, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = measure.name;
      button.setAttribute('aria-pressed', String(index === 0));
      if (index === 0) button.classList.add('active');
      button.addEventListener('click', () => showMeasure(measure, button));
      measureList.append(button);
    });
    showMeasure(measures[0], measureList.firstElementChild);
  };

  familyTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showFamily(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? familyTabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + familyTabs.length) % familyTabs.length;
      familyTabs[nextIndex].focus();
      showFamily(familyTabs[nextIndex]);
    });
  });

  showFamily(familyTabs.find(tab => tab.getAttribute('aria-selected') === 'true') || familyTabs[0]);
}

const pharmaLightbox = document.querySelector('.pharma-case-lightbox, .pharma-lightbox');
if (pharmaLightbox) {
  const image = pharmaLightbox.querySelector('img');
  const caption = pharmaLightbox.querySelector('p');
  const closeButton = pharmaLightbox.querySelector('.pharma-case-lightbox-close, .pharma-lightbox-close');
  document.querySelectorAll('[data-pharma-lightbox]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const preview = trigger.querySelector('img');
      image.src = trigger.dataset.pharmaLightbox;
      image.alt = preview?.alt || 'Power BI report preview';
      caption.textContent = preview?.alt || '';
      pharmaLightbox.showModal();
      closeButton.focus();
    });
  });
  const closeLightbox = () => pharmaLightbox.close();
  closeButton.addEventListener('click', closeLightbox);
  pharmaLightbox.addEventListener('click', event => {
    if (event.target === pharmaLightbox) closeLightbox();
  });
}

/* Forecasting page: switch only among verified, report-based horizon results. */
const forecastExplorer = document.querySelector('[data-forecast-explorer]');
if (forecastExplorer) {
  const horizonResults = {
    12: { linear: 2.06, knn: 2.06, boosting: 1.51, title: '12h · Boosting has the lowest test MAE.', copy: 'At the shortest horizon, Boosting achieved approximately 1.51°C MAE.' },
    24: { linear: 2.01, knn: 2.15, boosting: 1.87, title: '24h · Boosting remains the lowest-error model.', copy: 'The model comparison still favoured Boosting at the 24-hour horizon.' },
    48: { linear: 2.54, knn: 2.56, boosting: 2.40, title: '48h · Every model faces greater forecasting uncertainty.', copy: 'Boosting remained lowest at 2.40°C MAE, while error increased with the longer horizon.' }
  };
  const title = forecastExplorer.querySelector('[data-forecast-insight-title]');
  const copy = forecastExplorer.querySelector('[data-forecast-insight-copy]');
  const updateHorizon = button => {
    const horizon = horizonResults[button.dataset.horizon];
    forecastExplorer.querySelectorAll('[data-horizon]').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    ['linear', 'knn', 'boosting'].forEach(model => {
      const value = horizon[model];
      const bar = forecastExplorer.querySelector(`[data-model="${model}"]`);
      bar.style.setProperty('--forecast-bar', `${(value / 2.56) * 100}%`);
      bar.querySelector('b').textContent = `${value.toFixed(2)}°C`;
    });
    title.textContent = horizon.title;
    copy.textContent = horizon.copy;
  };
  forecastExplorer.querySelectorAll('[data-horizon]').forEach(button => {
    button.addEventListener('click', () => updateHorizon(button));
  });
}
