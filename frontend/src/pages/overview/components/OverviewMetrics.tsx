import React from "react";

export function OverviewMetrics() {
  return (
            <div className="metrics-region" data-node-id="nuvio.metrics">
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.tickets" data-tone="success" data-metric="tickets" aria-label="Pipeline aktif">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Pipeline aktif</h2>
                  <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">0</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">Database</span>
                      <span>real-time</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.resolution" data-tone="success" data-metric="resolution" aria-label="Menunggu approval">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Menunggu approval</h2>
                  <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">0</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">Antrean</span>
                      <span>SLA aktif</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.compliance" data-tone="danger" data-metric="compliance" aria-label="Deadline minggu ini">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Deadline minggu ini</h2>
                  <iconify-icon noobserver icon="lucide:calendar-clock" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">0</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">Target</span>
                      <span>minggu berjalan</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
                            {/* agent:nuvio.metrics-content */}

            </div>
  );
}
