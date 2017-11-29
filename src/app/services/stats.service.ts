import {Injectable, isDevMode} from '@angular/core';

@Injectable()
export class StatsService {
  // tslint:disable-next-line
  private readonly _yandexMetrikaCounterScript = '(function (d, w, c) { (w[c] = w[c] || []).push(function() { try { w.yaCounter46821447 = new Ya.Metrika({ id:46821447, clickmap:true, trackLinks:true, accurateTrackBounce:true }); } catch(e) { } }); var n = d.getElementsByTagName("script")[0], s = d.createElement("script"), f = function () { n.parentNode.insertBefore(s, n); }; s.type = "text/javascript"; s.async = true; s.src = "https://mc.yandex.ru/metrika/watch.js"; if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); } })(document, window, "yandex_metrika_callbacks");';
  private readonly _yaCounterName = 'yaCounter46821447';

  constructor() {
    if (!isDevMode()) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = this._yandexMetrikaCounterScript;
      document.head.appendChild(script);
    }
  }

  private safeInvoke(func: string, ...args: any[]): any {
    if (isDevMode()) {
      console.log(func, JSON.stringify(args, null, 2));
    }
    if (this._yaCounterName in window) {
      return window[this._yaCounterName][func](...args);
    }
  }

  reachGoal(target: string, params?: Object): void {
    this.safeInvoke('reachGoal', target, params);
  }
}
