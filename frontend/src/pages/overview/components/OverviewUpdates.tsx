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
                    <strong>8</strong>
                    {' '}aktivitas baru hari ini
                  </p>
                  <div className="c-kravio-updates__list" data-part="list">
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.quotation" data-tone="info">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Quotation diajukan</h3>
                            <time data-part="time">11:20</time>
                          </div>
                          <p data-part="description">Q-2026-014 PT Nusantara menunggu approval</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.opportunity" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:target" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Opportunity baru</h3>
                            <time data-part="time">11:15</time>
                          </div>
                          <p data-part="description">OP-108 dari lead campaign Q4</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.approval" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Approval disetujui</h3>
                            <time data-part="time">11:00</time>
                          </div>
                          <p data-part="description">Sales Order SO-2026-021 disetujui</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.risk" data-tone="danger">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Project at risk</h3>
                            <time data-part="time">10:45</time>
                          </div>
                          <p data-part="description">PRJ-042 variance biaya 8%</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.purchase" data-tone="warning">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:clipboard-list" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Purchase Request</h3>
                            <time data-part="time">10:30</time>
                          </div>
                          <p data-part="description">PR-331 menunggu budget check</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.invoice" data-tone="cyan">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:receipt" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Invoice diposting</h3>
                            <time data-part="time">10:10</time>
                          </div>
                          <p data-part="description">INV-088 AR · three-way match</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.payment" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:circle-check" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Payment diterima</h3>
                            <time data-part="time">09:50</time>
                          </div>
                          <p data-part="description">Rekonsiliasi bank Rp 320 jt</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.rups" data-tone="violet">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:gavel" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">RUPS dijadwalkan</h3>
                            <time data-part="time">09:05</time>
                          </div>
                          <p data-part="description">Agenda &amp; undangan terkirim</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.quotation" data-tone="info">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Quotation dikirim</h3>
                            <time data-part="time">17:40</time>
                          </div>
                          <p data-part="description">Q-2026-013 terkirim ke customer</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.received" data-tone="warning">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:package" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Goods Receipt</h3>
                            <time data-part="time">15:12</time>
                          </div>
                          <p data-part="description">GR-044 partial receipt vendor</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.delegation" data-tone="violet">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:repeat-2" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Delegasi approval</h3>
                            <time data-part="time">13:26</time>
                          </div>
                          <p data-part="description">Approver delegasi sampai 7 Okt</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.audit" data-tone="cyan">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Audit event</h3>
                            <time data-part="time">11:05</time>
                          </div>
                          <p data-part="description">Perubahan vendor master tercatat</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.stock" data-tone="danger">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:boxes" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Stock opname</h3>
                            <time data-part="time">09:30</time>
                          </div>
                          <p data-part="description">Gudang utama · 12 variance</p>
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
