import { Injectable, isDevMode } from '@angular/core';

@Injectable()
export class StatsService {
  private readonly _yandexMetrikaCounterScript = '(function (d, w, c) { (w[c] = w[c] || []).push(function() { try { w.yaCounter49001738 = new Ya.Metrika({ id:49001738, clickmap:true, trackLinks:true, accurateTrackBounce:true }); } catch(e) { } }); var n = d.getElementsByTagName("script")[0], s = d.createElement("script"), f = function () { n.parentNode.insertBefore(s, n); }; s.type = "text/javascript"; s.async = true; s.src = "https://mc.yandex.ru/metrika/watch.js"; if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); } })(document, window, "yandex_metrika_callbacks");';
  private readonly _yaCounterName = 'yaCounter49001738';

  constructor() {
    if (!isDevMode()) {
      eval(this._yandexMetrikaCounterScript);
    }
  }

  private safeInvoke(func: string, ...args: any[]) {
    if (isDevMode()) {
      console.log(func, JSON.stringify(args, null, 2));
    }
    if (this._yaCounterName in window) {
      return window[this._yaCounterName][func](...args);
    }
  }

  readonly noValue = 'No value';

  event(params: Object) {
    this.safeInvoke('reachGoal', 'event', params);
  }
}
