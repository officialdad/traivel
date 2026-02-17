export function renderLinkEditor(initialLinks = []) {
  const container = document.createElement('div');
  let links = [...initialLinks];

  function render() {
    container.innerHTML = '';

    const label = document.createElement('label');
    label.innerHTML = '<i class="fa-solid fa-link"></i> Reference Links';
    container.appendChild(label);

    links.forEach((link, i) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `
        <input type="text" placeholder="Title" value="${escapeAttr(link.title)}" data-idx="${i}" data-field="title" />
        <input type="url" placeholder="https://..." value="${escapeAttr(link.url)}" data-idx="${i}" data-field="url" />
        <button type="button" class="outline btn-delete" data-remove="${i}"><i class="fa-solid fa-xmark"></i></button>
      `;
      container.appendChild(row);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'outline secondary';
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Link';
    addBtn.addEventListener('click', () => {
      links.push({ url: '', title: '' });
      render();
    });
    container.appendChild(addBtn);

    container.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const field = e.target.dataset.field;
        links[idx][field] = e.target.value;
      });
    });

    container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.closest('[data-remove]').dataset.remove);
        links.splice(idx, 1);
        render();
      });
    });
  }

  render();

  return {
    element: container,
    getValue: () => links.filter((l) => l.url || l.title),
  };
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
