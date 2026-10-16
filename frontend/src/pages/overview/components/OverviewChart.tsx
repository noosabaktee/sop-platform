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
                    <strong className="c-kravio-chart__total" data-part="total">Rp 0</strong>
                    <span className="c-kravio-chart__comparison">
                      <strong>7 hari</strong>
                      terakhir
                    </span>
                  </div>
                  <div className="c-kravio-chart__plot" data-part="plot">
                    <div className="c-kravio-chart__bars" role="group" aria-label="Volume pipeline per hari. Gunakan tombol panah untuk memeriksa bar.">
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 1" data-action="kravio-chart:inspect" aria-label="Day 1: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 2" data-action="kravio-chart:inspect" aria-label="Day 2: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 3" data-action="kravio-chart:inspect" aria-label="Day 3: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 4" data-action="kravio-chart:inspect" aria-label="Day 4: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 5" data-action="kravio-chart:inspect" aria-label="Day 5: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 6" data-action="kravio-chart:inspect" aria-label="Day 6: Rp 0" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "5%" }} data-value="0" data-day="Day 7" data-action="kravio-chart:inspect" aria-label="Day 7: Rp 0" aria-pressed="true"></button>
                    </div>
                    <div className="c-kravio-chart__marker" data-part="marker">
                      <span className="c-kravio-chart__tooltip" data-part="tooltip">Penjualan harian</span>
                    </div>
                    <div className="c-kravio-chart__axis" aria-hidden="true">
                      <span>Max</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="c-kravio-chart__days" aria-hidden="true">
                    <span>H-6</span>
                    <span>H-5</span>
                    <span>H-4</span>
                    <span>H-3</span>
                    <span>H-2</span>
                    <span>Kemarin</span>
                    <span>Hari ini</span>
                  </div>
                </div>
              </section>
                            {/* agent:nuvio.chart-content */}

            </div>
  );
}
