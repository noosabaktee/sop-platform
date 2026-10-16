import React from "react";

export function OverviewUpdates() {
  return (
            <div className="updates-region" data-node-id="nuvio.updates">
              <section className="c-kravio-updates" data-component="kravio-updates" data-node-id="nuvio.latest-updates" aria-label="Aktivitas terbaru" data-period="today">
                <div className="c-kravio-updates__heading">
                  <h2>Aktivitas terbaru</h2>
                  <iconify-icon noobserver icon="lucide:newspaper" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-updates__body">
                  <div className="c-kravio-updates__tabs" role="group" aria-label="Rentang aktivitas">
                    <button type="button" data-action="kravio-updates:period" data-period="today" aria-pressed="true">Hari ini</button>
                    <button type="button" data-action="kravio-updates:period" data-period="yesterday" aria-pressed="false">Kemarin</button>
                    <button type="button" data-action="kravio-updates:period" data-period="week" aria-pressed="false">Minggu ini</button>
                  </div>
                  <label className="c-kravio-search" data-component="kravio-search" data-node-id="kravio.activity-search">
                    <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                    <input type="search" placeholder="Cari aktivitas" aria-label="Cari aktivitas" data-action="kravio-updates:search" data-part="input" />
                  </label>
                  <p className="c-kravio-updates__count" data-part="count" aria-live="polite">
                    <strong>0</strong>
                    {' '}aktivitas baru hari ini
                  </p>
                  <div className="c-kravio-updates__list" data-part="list">
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.template" data-tone="info">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Memuat aktivitas...</h3>
                            <time data-part="time">—</time>
                          </div>
                          <p data-part="description">Sinkronisasi log aktivitas dari database...</p>
                        </div>
                      </article>
                    </div>
                    <p className="c-kravio-updates__empty" data-part="empty" hidden>Tidak ada aktivitas yang cocok.</p>
                  </div>
                </div>
              </section>
                            {/* agent:nuvio.updates-content */}

            </div>
  );
}
