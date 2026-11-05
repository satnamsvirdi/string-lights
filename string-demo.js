import {
  createStringLights,
  shapes,
  modes,
  createBulbPreview,
  stringLightsPresets,
} from './StringLights.js';
const $ = (id) => document.getElementById(id);
const defaults = {
  mode: 'twinkle',
  animated: true,
  pagePosition: 'absolute',
  colors: 'multicolor',
  shape: 'rice',
  spacing: 28,
  anchorCount: 0,
  size: 1.2,
  speed: 1,
  glow: 0.65,
  glitter: false,
  dimBase: false,
  breeze: true,
  interactive: true,
  collisions: true,
  seed: 7,
  paused: false,
  patternOrder: 'fixed',
  patternInterval: 10,
  patternSequence: ['blink', 'chase', 'wave', 'twinkle'],
};
const records = [];
let selected,
  serial = 0,
  pagePreview = null;
const clone = (options) => ({
  ...options,
  shape: Array.isArray(options.shape) ? [...options.shape] : options.shape,
  patternSequence: [...options.patternSequence],
});
const valueKeys = [
  'colors',
  'mode',
  'layout',
  'spacing',
  'anchorCount',
  'size',
  'speed',
  'glow',
  'glitter',
  'dimBase',
  'breeze',
  'interactive',
  'collisions',
  'animated',
  'pagePosition',
  'patternOrder',
  'patternInterval',
];
function snippet() {
  const configs = records.map((record) => ({
    target: `#${record.stage.id}`,
    options: record.options,
  }));
  return `import { createStringLights } from './StringLights.js';\n\n// Each target is your own section or component.\nconst strings = ${JSON.stringify(configs, null, 2)}\n  .map(({ target, options }) => createStringLights(target, options));\n\n// Each controller is independent:\n// strings[0].pause(); strings[1].update({ colors: 'white' });\n// strings.forEach(string => string.destroy());`;
}
function updateCode() {
  $('code').textContent = snippet();
}
function updateBadge(record) {
  record.badge.textContent = record.controller.pattern;
  if (selected === record) $('activePattern').textContent = record.controller.pattern;
}
function updateMenu() {
  $('stringSelect').replaceChildren(
    ...records.map((record) => {
      const option = document.createElement('option');
      option.value = String(record.id);
      option.textContent = record.name;
      return option;
    }),
  );
  if (selected) $('stringSelect').value = String(selected.id);
  $('removeString').disabled = records.length === 1;
  $('pause').textContent = records.every((record) => record.options.paused)
    ? 'Play all strings'
    : 'Pause all strings';
}
function reflect() {
  for (const key of valueKeys) {
    const input = $(key);
    if (input.type === 'checkbox') input.checked = selected.options[key];
    else input.value = selected.options[key];
  }
  const mixed = Array.isArray(selected.options.shape);
  $('shape').value = mixed ? 'mixed' : selected.options.shape;
  $('shapeMix').hidden = !mixed;
  $('shapeMix')
    .querySelectorAll('input')
    .forEach((input) => (input.checked = mixed && selected.options.shape.includes(input.value)));
  $('patternMix')
    .querySelectorAll('input')
    .forEach((input) => (input.checked = selected.options.patternSequence.includes(input.value)));
  $('programControls').hidden = selected.options.patternOrder === 'fixed';
  $('sequenceOrder').textContent =
    (selected.options.patternOrder === 'random' ? 'Shuffle pool: ' : 'Order: ') +
    selected.options.patternSequence.join(', ');
  $('mode').disabled = selected.options.patternOrder !== 'fixed';
  $('stringName').value = selected.name;
  $('pauseSelected').textContent = selected.options.paused
    ? 'Play this string'
    : 'Pause this string';
  $('spacingValue').textContent = `${selected.options.spacing} px`;
  $('anchorCountValue').textContent = selected.options.anchorCount || 'Auto';
  $('sizeValue').textContent = `${Number(selected.options.size).toFixed(1)}×`;
  $('activePattern').textContent = selected.controller.pattern;
}
function select(record) {
  selected = record;
  records.forEach((item) => (item.sample.dataset.selected = String(item === record)));
  updateMenu();
  reflect();
}
function styleStage(record) {
  record.stage.dataset.layout = record.options.layout;
  record.stage.classList.toggle('light', record.options.layout === 'border');
  const copy = record.stage.querySelector('.copy');
  if (copy) copy.style.paddingTop = record.options.layout === 'draped' ? '120px' : '';
}
function apply(patch) {
  selected.controller.update(patch);
  Object.assign(selected.options, patch);
  styleStage(selected);
  if (pagePreview?.record === selected) pagePreview.controller.update(patch);
  updateBadge(selected);
  updateCode();
  reflect();
  updateMenu();
}
function add(sample, options, name) {
  const id = ++serial;
  const record = {
    id,
    sample,
    stage: sample.querySelector('.stage'),
    name,
    options: clone(options),
  };
  record.stage.id = `string-${id}`;
  const oldHeading = sample.querySelector('h2');
  oldHeading.remove();
  const header = document.createElement('div');
  header.className = 'sampleHeader';
  record.heading = document.createElement('h2');
  record.heading.textContent = name;
  record.badge = document.createElement('span');
  record.badge.className = 'patternBadge';
  const edit = document.createElement('button');
  edit.className = 'editString';
  edit.textContent = 'Edit';
  edit.onclick = () => {
    select(record);
    if (innerWidth <= 900)
      $('stringSelect').scrollIntoView({ block: 'center', behavior: 'instant' });
  };
  header.append(record.heading, record.badge, edit);
  sample.prepend(header);
  styleStage(record);
  record.controller = createStringLights(record.stage, record.options);
  record.controller.element.addEventListener('stringpatternchange', () => updateBadge(record));
  records.push(record);
  updateBadge(record);
  return record;
}
for (const shape of shapes) {
  const label = document.createElement('label'),
    input = document.createElement('input');
  input.type = 'checkbox';
  input.value = shape;
  input.onchange = () => {
    const list = Array.isArray(selected.options.shape)
      ? [...selected.options.shape]
      : [selected.options.shape];
    const next = input.checked ? [...list, shape] : list.filter((item) => item !== shape);
    if (!next.length) {
      input.checked = true;
      return;
    }
    apply({ shape: next });
  };
  label.append(input, document.createTextNode(shape));
  $('shapeMix').append(label);
}
for (const mode of modes) {
  const label = document.createElement('label'),
    input = document.createElement('input');
  input.type = 'checkbox';
  input.value = mode;
  input.onchange = () => {
    const list = selected.options.patternSequence;
    const next = input.checked ? [...list, mode] : list.filter((item) => item !== mode);
    if (!next.length) {
      input.checked = true;
      return;
    }
    apply({ patternSequence: next });
  };
  label.append(input, document.createTextNode(mode));
  $('patternMix').append(label);
}
[...document.querySelectorAll('.sample')].forEach((sample, index) => {
  const layout = sample.querySelector('.stage').dataset.layout;
  const options = {
    ...defaults,
    layout,
    seed: 7 + index,
    mode: ['twinkle', 'wave', 'twinkle', 'chase'][index],
  };
  if (layout === 'draped') options.colors = 'warm';
  add(sample, options, ['Roofline', 'Curtain', 'Draped', 'Component border'][index]);
});
select(records[0]);
updateCode();
$('stringSelect').onchange = (event) =>
  select(records.find((record) => record.id === Number(event.target.value)));
function addNew(options, name) {
  const sample = document.createElement('section');
  sample.className = 'sample';
  const heading = document.createElement('h2');
  const stage = document.createElement('div');
  stage.className = 'stage';
  const copy = document.createElement('div');
  copy.className = 'copy';
  const title = document.createElement('h3');
  title.textContent = 'Another string of light.';
  const text = document.createElement('p');
  text.textContent = 'Its own bulbs, colors, and rhythm.';
  copy.append(title, text);
  stage.append(copy);
  sample.append(heading, stage);
  document.querySelector('.views').append(sample);
  const independent = clone(options);
  independent.seed = serial + 17;
  independent.paused = false;
  select(add(sample, independent, name));
  updateCode();
}
$('addString').onclick = () => addNew(selected.options, `String ${serial + 1}`);
for (const [id, preset] of Object.entries(stringLightsPresets)) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = preset.name;
  $('preset').append(option);
}
function describePreset() {
  $('presetDescription').textContent = stringLightsPresets[$('preset').value].description;
}
$('preset').onchange = describePreset;
describePreset();
$('applyPreset').onclick = () => {
  const preset = stringLightsPresets[$('preset').value];
  apply(
    clone({
      ...preset.options,
      seed: selected.options.seed,
      paused: selected.options.paused,
      animated: selected.options.animated,
      pagePosition: selected.options.pagePosition,
    }),
  );
  $('notice').textContent =
    `${preset.name} applied to ${selected.name}. Customize any control below.`;
};
$('addPreset').onclick = () => {
  const preset = stringLightsPresets[$('preset').value];
  addNew(preset.options, preset.name);
  $('notice').textContent = `${preset.name} added as a separate string.`;
};
$('removeString').onclick = () => {
  if (records.length === 1) return;
  if (pagePreview?.record === selected) {
    pagePreview.controller.destroy();
    pagePreview = null;
  }
  const index = records.indexOf(selected);
  selected.controller.destroy();
  selected.sample.remove();
  records.splice(index, 1);
  select(records[Math.min(index, records.length - 1)]);
  updateCode();
  updatePageButton();
};
$('stringName').oninput = (event) => {
  selected.name = event.target.value.trim() || 'Unnamed string';
  selected.heading.textContent = selected.name;
  updateMenu();
};
$('shape').onchange = (event) =>
  apply({
    shape: event.target.value === 'mixed' ? ['rice', 'round', 'flower'] : event.target.value,
  });
for (const key of valueKeys)
  $(key).addEventListener(key === 'patternInterval' ? 'change' : 'input', (event) => {
    const input = event.target;
    if (key === 'patternInterval' && !input.checkValidity()) {
      input.reportValidity();
      return;
    }
    const value =
      input.type === 'checkbox'
        ? input.checked
        : ['range', 'number'].includes(input.type)
          ? Number(input.value)
          : input.value;
    apply({ [key]: value });
  });
$('randomize').onclick = () => apply({ seed: selected.options.seed + 1 });
function setPaused(record, paused) {
  record.options.paused = paused;
  record.controller[paused ? 'pause' : 'play']();
  if (pagePreview?.record === record) pagePreview.controller[paused ? 'pause' : 'play']();
}
$('pauseSelected').onclick = () => {
  setPaused(selected, !selected.options.paused);
  reflect();
  updateMenu();
  updateCode();
};
$('pause').onclick = () => {
  const paused = !records.every((record) => record.options.paused);
  records.forEach((record) => setPaused(record, paused));
  reflect();
  updateMenu();
  updateCode();
};
function updatePageButton() {
  $('pageToggle').textContent = pagePreview
    ? 'Remove full page preview'
    : 'Preview selected full page';
}
$('pageToggle').onclick = () => {
  if (pagePreview) {
    pagePreview.controller.destroy();
    pagePreview = null;
  } else
    pagePreview = {
      record: selected,
      controller: createStringLights(document.body, selected.options),
    };
  updatePageButton();
};
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(snippet());
    $('notice').textContent = 'Independent string configurations copied.';
  } catch {
    $('notice').textContent = 'Select and copy the code shown above.';
  }
};
document
  .querySelectorAll('.try')
  .forEach(
    (button) => (button.onclick = () => (button.textContent = 'Clicks pass through the lights')),
  );
const specimenColors = ['#ff3158', '#35f269', '#4385ff', '#ff46bd', '#ffffff', '#ffc329'];
for (const [index, shape] of [...shapes, 'glitter'].entries()) {
  const el = document.createElement('div');
  el.className = 'specimen';
  el.append(
    createBulbPreview({
      shape: shape === 'glitter' ? 'rice' : shape,
      glitter: shape === 'glitter',
      colors: [specimenColors[index]],
      glow: 0.8,
    }),
  );
  const label = document.createElement('span');
  label.textContent = shape === 'led' ? 'Classic LED' : shape;
  el.append(label);
  document.querySelector('.strip').append(el);
}
if (matchMedia('(prefers-reduced-motion: reduce)').matches)
  $('notice').textContent =
    'Reduced motion is enabled. Lights remain static and pattern switching is suspended.';
