import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="not-found">
      <div class="content">
        <div class="code">404</div>
        <h1 class="title">Page not found</h1>
        <p class="sub">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="home-btn">Go to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600&display=swap');

    .not-found {
      min-height: 100vh;
      background: #0A231C;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'DM Sans', sans-serif;
    }

    .content {
      text-align: center;
      padding: 32px;
    }

    .code {
      font-family: 'Playfair Display', serif;
      font-size: 96px;
      font-weight: 600;
      color: #C5E8D1;
      line-height: 1;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 10px;
    }

    .sub {
      font-size: 15px;
      color: rgba(197,232,209,0.55);
      margin-bottom: 32px;
    }

    .home-btn {
      display: inline-block;
      padding: 12px 28px;
      background: #C5E8D1;
      color: #0A231C;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .home-btn:hover { opacity: 0.88; }
  `],
})
export class NotFoundComponent {}
