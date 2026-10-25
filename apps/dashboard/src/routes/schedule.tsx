import { Checkbox } from '../components/ui/checkbox';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components/ui/collapsible';
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../lib/state';
import { Panel, Field, Input, Toggle, SaveBar, Loading } from '../components/common';
import { Button } from '../components/ui/button';
export const Route = createFileRoute('/schedule')({ component: Schedule });
function Schedule() {
  const settings = useSettings();
  const { config, setConfig } = settings;
  if (!config) return <Loading />;
  const n = config.night,
    l = config.listen;
  return (
    <>
      <h1 className="page-title">活动时间</h1>
      <div className="page-stack schedule-page">
        <div className="page-stack">
          <Panel>
            <Field label="时区">
              <Input
                value={config.timezone}
                list="timezones"
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              />
              <datalist id="timezones">
                {[
                  'Asia/Shanghai',
                  'Asia/Tokyo',
                  'Asia/Singapore',
                  'Europe/London',
                  'America/New_York',
                  'America/Los_Angeles',
                  'UTC',
                ].map((t) => (
                  <NativeSelectOption key={t} value={t} />
                ))}
              </datalist>
            </Field>
          </Panel>
          <Panel>
            <div className="section-heading">
              <h2>每日活动时段</h2>
              <Button
                variant="ghost"
                disabled={n.windows.length >= 4}
                onClick={() =>
                  setConfig({
                    ...config,
                    night: {
                      ...n,
                      windows: [...n.windows, { start: '20:00', end: '24:00', wakes: 1 }],
                    },
                  })
                }
              >
                <Plus size={16} />
                添加时段
              </Button>
            </div>
            <div className="time-windows">
              {n.windows.map((w, i) => (
                <div className="time-window" key={i}>
                  <label className="window-label">
                    <Checkbox
                      checked={w.wakes > 0}
                      aria-label={'启用时段' + (i + 1)}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          night: {
                            ...n,
                            windows: n.windows.map((x, j) =>
                              j === i ? { ...x, wakes: checked ? 1 : 0 } : x,
                            ),
                          },
                        })
                      }
                    />
                    时段 {i + 1}
                  </label>
                  <Input
                    aria-label={'时段' + (i + 1) + '开始'}
                    value={w.start}
                    placeholder="20:00"
                    maxLength={5}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        night: {
                          ...n,
                          windows: n.windows.map((x, j) =>
                            j === i ? { ...x, start: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <span>–</span>
                  <Input
                    aria-label={'时段' + (i + 1) + '结束'}
                    value={w.end}
                    placeholder="24:00"
                    maxLength={5}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        night: {
                          ...n,
                          windows: n.windows.map((x, j) =>
                            j === i ? { ...x, end: e.target.value } : x,
                          ),
                        },
                      })
                    }
                  />
                  <label className="window-count">
                    最多
                    <NativeSelect
                      aria-label={'时段' + (i + 1) + '机会数'}
                      value={w.wakes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          night: {
                            ...n,
                            windows: n.windows.map((x, j) =>
                              j === i ? { ...x, wakes: Number(e.target.value) } : x,
                            ),
                          },
                        })
                      }
                    >
                      {[0, 1, 2, 3].map((x) => (
                        <NativeSelectOption value={x} key={x}>
                          {x}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    次机会
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={'删除时段' + (i + 1)}
                    disabled={n.windows.length === 1}
                    onClick={() =>
                      setConfig({
                        ...config,
                        night: { ...n, windows: n.windows.filter((_, j) => j !== i) },
                      })
                    }
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2>逛 B 站的习惯</h2>
            <div className="form-columns">
              <Field label="这次歇一歇的概率">
                <div className="with-unit">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(n.skipChance * 100)}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        night: { ...n, skipChance: Number(e.target.value) / 100 },
                      })
                    }
                  />
                  <span>%</span>
                </div>
              </Field>
              <Field label="两次闲逛至少间隔">
                <div className="with-unit">
                  <Input
                    type="number"
                    min={10}
                    max={1440}
                    value={n.minGapMin}
                    onChange={(e) =>
                      setConfig({ ...config, night: { ...n, minGapMin: Number(e.target.value) } })
                    }
                  />
                  <span>分钟</span>
                </div>
              </Field>
              <Field label="每次最多看几个视频">
                <div className="with-unit">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={n.maxVideos}
                    onChange={(e) =>
                      setConfig({ ...config, night: { ...n, maxVideos: Number(e.target.value) } })
                    }
                  />
                  <span>个</span>
                </div>
              </Field>
            </div>
          </Panel>
          <Panel>
            <h2>留意新消息</h2>
            <div className="form-columns">
              {(
                [
                  ['comment', '评论'],
                  ['dm', '私信'],
                  ['live', '直播弹幕'],
                ] as const
              ).map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={l[key]}
                  onChange={(value) => setConfig({ ...config, listen: { ...l, [key]: value } })}
                />
              ))}
            </div>
            {(l.comment || l.dm || l.live) && (
              <Collapsible className="listener-details">
                <CollapsibleTrigger className="disclosure-trigger">消息设置</CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="form-columns">
                    {l.comment && (
                      <Field label="检查评论的间隔（秒）">
                        <Input
                          type="number"
                          min={60}
                          max={3600}
                          value={l.commentIntervalSec}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              listen: { ...l, commentIntervalSec: Number(e.target.value) },
                            })
                          }
                        />
                      </Field>
                    )}
                    {l.dm && (
                      <Field label="检查私信的间隔（秒）">
                        <Input
                          type="number"
                          min={60}
                          max={3600}
                          value={l.dmIntervalSec}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              listen: { ...l, dmIntervalSec: Number(e.target.value) },
                            })
                          }
                        />
                      </Field>
                    )}
                    {l.live && (
                      <Field label="直播间号">
                        <Input
                          inputMode="numeric"
                          value={l.liveRoom}
                          onChange={(e) =>
                            setConfig({ ...config, listen: { ...l, liveRoom: e.target.value } })
                          }
                        />
                      </Field>
                    )}
                  </div>
                  <div className="listener-options">
                    {l.live && (
                      <Field label="留意哪些弹幕">
                        <NativeSelect
                          value={l.liveScope}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              listen: { ...l, liveScope: e.target.value as 'owner' | 'mention' },
                            })
                          }
                        >
                          <NativeSelectOption value="owner">仅主人</NativeSelectOption>
                          <NativeSelectOption value="mention">
                            只看提到小白龙的消息
                          </NativeSelectOption>
                        </NativeSelect>
                      </Field>
                    )}
                    <Toggle
                      label="活动时间外也留意消息"
                      checked={l.allDay}
                      onChange={(allDay) => setConfig({ ...config, listen: { ...l, allDay } })}
                    />
                    <Toggle
                      label="每人只回一次"
                      checked={l.oncePerPerson}
                      onChange={(oncePerPerson) =>
                        setConfig({ ...config, listen: { ...l, oncePerPerson } })
                      }
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </Panel>
        </div>
        <SaveBar {...settings} />
      </div>
    </>
  );
}
