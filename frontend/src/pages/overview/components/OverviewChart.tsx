import React from "react";

export function OverviewChart() {
  return (
            <div className="chart-region" data-node-id="nuvio.chart">
              <section className="c-kravio-chart" data-component="kravio-chart" data-node-id="nuvio.ticket-volume" aria-label="Tren pipeline dan penjualan">
                <div className="c-kravio-chart__heading">
                  <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                  <h2>Tren pipeline & penjualan</h2>
                  <label className="c-kravio-range" data-component="kravio-range" data-node-id="kravio.trend-range" data-target="trend">
                    <iconify-icon noobserver icon="lucide:calendar-days" aria-hidden="true"></iconify-icon>
                    <select data-action="kravio-range:change" data-part="select" aria-label="trend time range">
                      <option>Last week</option>
                      <option>Last month</option>
                      <option>Last quarter</option>
                    </select>
                    <iconify-icon noobserver icon="lucide:chevron-down" aria-hidden="true"></iconify-icon>
                  </label>
                </div>
                <div className="c-kravio-chart__body" data-part="body">
                  <div className="c-kravio-chart__summary">
                    <strong className="c-kravio-chart__total" data-part="total">4,790</strong>
                    <span className="c-kravio-chart__comparison">
                      <strong>+8%</strong>
                      vs last week
                    </span>
                  </div>
                  <div className="c-kravio-chart__plot" data-part="plot">
                    <div className="c-kravio-chart__bars" role="group" aria-label="Volume pipeline per hari. Gunakan tombol panah untuk memeriksa bar.">
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "31.77777777777778%" }} data-value="286" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 286 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Sun" data-action="kravio-chart:inspect" aria-label="Sun: 584 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Mon" data-action="kravio-chart:inspect" aria-label="Mon: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "44.333333333333336%" }} data-value="399" data-day="Mon" data-action="kravio-chart:inspect" aria-label="Mon: 399 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "59.77777777777777%" }} data-value="538" data-day="Tue" data-action="kravio-chart:inspect" aria-label="Tue: 538 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Tue" data-action="kravio-chart:inspect" aria-label="Tue: 584 tickets" aria-pressed="true"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "51.33333333333333%" }} data-value="462" data-day="Wed" data-action="kravio-chart:inspect" aria-label="Wed: 462 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Wed" data-action="kravio-chart:inspect" aria-label="Wed: 584 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "85%" }} data-value="765" data-day="Thu" data-action="kravio-chart:inspect" aria-label="Thu: 765 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Thu" data-action="kravio-chart:inspect" aria-label="Thu: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "69.55555555555556%" }} data-value="626" data-day="Fri" data-action="kravio-chart:inspect" aria-label="Fri: 626 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Fri" data-action="kravio-chart:inspect" aria-label="Fri: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "39.22222222222223%" }} data-value="353" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 353 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "79.33333333333333%" }} data-value="714" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 714 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "58.333333333333336%" }} data-value="525" data-day="Sun" data-action="kravio-chart:inspect" aria-label="Sun: 525 tickets" aria-pressed="false"></button>
                    </div>
                    <div className="c-kravio-chart__marker" data-part="marker">
                      <span className="c-kravio-chart__tooltip" data-part="tooltip">Tue: 584</span>
                    </div>
                    <div className="c-kravio-chart__axis" aria-hidden="true">
                      <span>800</span>
                      <span>600</span>
                      <span>400</span>
                      <span>200</span>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="c-kravio-chart__days" aria-hidden="true">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                </div>
              </section>
                            {/* agent:nuvio.chart-content */}

            </div>
  );
}
