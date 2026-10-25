import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import type { Activity } from '@bili-dragon/runtime/types';
import { Panel } from '../components/common';
import { ActivityList } from '../components/activity-list';
import { NativeSelect, NativeSelectOption } from '../components/ui/native-select';
export const Route = createFileRoute('/activity')({ component: ActivityPage });
const states = {
  running: '进行中',
  success: '已完成',
  failed: '未完成',
  unknown: '待核查',
  draft: '待审核',
};
function ActivityPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState<Activity['state'] | ''>('');
  return (
    <Panel>
      <h1>行动记录</h1>
      <div className="review-filters activity-filters">
        <NativeSelect
          aria-label="行动类型"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
          }}
        >
          {Object.entries({
            '': '全部行动',
            dm: '私信',
            comments: '评论',
            search: '搜索',
            read: '阅读素材',
            diary: '日记',
            favorite: '收藏',
            task: '运行任务',
            feedback: '查看反馈',
          }).map(([value, label]) => (
            <NativeSelectOption value={value} key={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="行动结果"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
          }}
        >
          <NativeSelectOption value="">全部结果</NativeSelectOption>
          {Object.entries(states).map(([value, label]) => (
            <NativeSelectOption value={value} key={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <ActivityList key={type + status} type={type} status={status} />
    </Panel>
  );
}
