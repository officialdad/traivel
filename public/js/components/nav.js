export function renderNav() {
  const nav = document.createElement('nav');
  nav.className = 'app-nav';
  nav.innerHTML = `
    <div class="container">
      <ul>
        <li><a href="#/" class="brand"><i class="fa-solid fa-route"></i> Traivel</a></li>
      </ul>
      <ul>
        <li><a href="#/"><i class="fa-solid fa-list"></i> All Trips</a></li>
        <li><a href="#/itineraries/new" role="button" class="outline"><i class="fa-solid fa-plus"></i> New Trip</a></li>
      </ul>
    </div>
  `;
  return nav;
}
