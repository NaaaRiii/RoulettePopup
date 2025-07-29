import React from 'react';
import { render, waitFor, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoalsContext, GoalsProvider, useGoals } from '../../contexts/GoalsContext';

describe('GoalsContextコンテキスト', () => {
  it('初期状態で refresh は false である', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { refresh } = useGoals();
      return <div data-testid="refresh">{refresh.toString()}</div>;
    };

    // プロバイダーでラップしてレンダリング
    const { getByTestId } = render(
      <GoalsProvider>
        <TestComponent />
      </GoalsProvider>
    );

    // 初期値が false であることを確認
    expect(getByTestId('refresh')).toHaveTextContent('false');
  });

  it('初期状態で goalsState は空配列である', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { goalsState } = useGoals();
      return <div data-testid="goals-state">{JSON.stringify(goalsState)}</div>;
    };

    // プロバイダーでラップしてレンダリング
    const { getByTestId } = render(
      <GoalsProvider>
        <TestComponent />
      </GoalsProvider>
    );

    // 初期値が空配列であることを確認
    expect(getByTestId('goals-state')).toHaveTextContent('[]');
  });

  describe('refreshGoals の機能', () => {
    it('呼び出し時に refresh の値が反転すること', async () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const { refresh, refreshGoals } = useGoals();
        return (
          <div>
            <div data-testid="refresh">{refresh.toString()}</div>
            <button onClick={refreshGoals} data-testid="refresh-button">Refresh</button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('refresh')).toHaveTextContent('false');

      // refreshGoals を実行
      getByTestId('refresh-button').click();

      // 値が反転していることを確認
      await waitFor(() => {
        expect(getByTestId('refresh')).toHaveTextContent('true');
      });
    });

    it('複数回呼び出しでも正しく反転すること', async () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const { refresh, refreshGoals } = useGoals();
        return (
          <div>
            <div data-testid="refresh">{refresh.toString()}</div>
            <button onClick={refreshGoals} data-testid="refresh-button">Refresh</button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('refresh')).toHaveTextContent('false');

      // 1回目の refreshGoals を実行
      getByTestId('refresh-button').click();
      await waitFor(() => {
        expect(getByTestId('refresh')).toHaveTextContent('true');
      });

      // 2回目の refreshGoals を実行
      getByTestId('refresh-button').click();
      await waitFor(() => {
        expect(getByTestId('refresh')).toHaveTextContent('false');
      });

      // 3回目の refreshGoals を実行
      getByTestId('refresh-button').click();
      await waitFor(() => {
        expect(getByTestId('refresh')).toHaveTextContent('true');
      });
    });
  });

  describe('setGoalsState の機能', () => {
    it('新しい配列を設定できること', async () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const { goalsState, setGoalsState } = useGoals();
        return (
          <div>
            <div data-testid="goals-state">{JSON.stringify(goalsState)}</div>
            <button onClick={() => setGoalsState([{ id: 1, text: 'Test Goal' }])} data-testid="set-goals-button">
              Set Goals
            </button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('goals-state')).toHaveTextContent('[]');

      // setGoalsState を実行
      getByTestId('set-goals-button').click();

      // 新しい配列が設定されていることを確認
      await waitFor(() => {
        expect(getByTestId('goals-state')).toHaveTextContent('[{"id":1,"text":"Test Goal"}]');
      });
    });

    it('設定した値が正しく反映されること', async () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const { goalsState, setGoalsState } = useGoals();
        return (
          <div>
            <div data-testid="goals-state">{JSON.stringify(goalsState)}</div>
            <button onClick={() => setGoalsState([{ id: 1, text: 'First Goal' }])} data-testid="set-first-button">
              Set First
            </button>
            <button onClick={() => setGoalsState([{ id: 2, text: 'Second Goal' }])} data-testid="set-second-button">
              Set Second
            </button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('goals-state')).toHaveTextContent('[]');

      // 1回目の setGoalsState を実行
      getByTestId('set-first-button').click();
      await waitFor(() => {
        expect(getByTestId('goals-state')).toHaveTextContent('[{"id":1,"text":"First Goal"}]');
      });

      // 2回目の setGoalsState を実行
      getByTestId('set-second-button').click();
      await waitFor(() => {
        expect(getByTestId('goals-state')).toHaveTextContent('[{"id":2,"text":"Second Goal"}]');
      });
    });
  });

  describe('複数インスタンスの独立性', () => {
    it('複数のコンポーネントで使用しても、それぞれが独立した状態を持つこと', async () => {
      // テスト用のコンポーネント
      const TestComponent = ({ id }) => {
        const { goalsState, setGoalsState } = useGoals();
        return (
          <div>
            <div data-testid={`goals-state-${id}`}>{JSON.stringify(goalsState)}</div>
            <button 
              onClick={() => setGoalsState([{ id: id, text: `Goal ${id}` }])} 
              data-testid={`set-goals-button-${id}`}
            >
              Set Goals {id}
            </button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <>
          <GoalsProvider>
            <TestComponent id="1" />
          </GoalsProvider>
          <GoalsProvider>
            <TestComponent id="2" />
          </GoalsProvider>
        </>
      );

      // 初期状態を確認
      expect(getByTestId('goals-state-1')).toHaveTextContent('[]');
      expect(getByTestId('goals-state-2')).toHaveTextContent('[]');

      // 1つ目のコンポーネントの setGoalsState を実行
      getByTestId('set-goals-button-1').click();
      await waitFor(() => {
        expect(getByTestId('goals-state-1')).toHaveTextContent('[{"id":"1","text":"Goal 1"}]');
      });

      // 2つ目のコンポーネントの状態は変更されていないことを確認
      expect(getByTestId('goals-state-2')).toHaveTextContent('[]');

      // 2つ目のコンポーネントの setGoalsState を実行
      getByTestId('set-goals-button-2').click();
      await waitFor(() => {
        expect(getByTestId('goals-state-2')).toHaveTextContent('[{"id":"2","text":"Goal 2"}]');
      });

      // 1つ目のコンポーネントの状態は変更されていないことを確認
      expect(getByTestId('goals-state-1')).toHaveTextContent('[{"id":"1","text":"Goal 1"}]');
    });

    it('refresh の状態も独立していること', async () => {
      // テスト用のコンポーネント
      const TestComponent = ({ id }) => {
        const { refresh, refreshGoals } = useGoals();
        return (
          <div>
            <div data-testid={`refresh-${id}`}>{refresh.toString()}</div>
            <button onClick={refreshGoals} data-testid={`refresh-button-${id}`}>
              Refresh {id}
            </button>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <>
          <GoalsProvider>
            <TestComponent id="1" />
          </GoalsProvider>
          <GoalsProvider>
            <TestComponent id="2" />
          </GoalsProvider>
        </>
      );

      // 初期状態を確認
      expect(getByTestId('refresh-1')).toHaveTextContent('false');
      expect(getByTestId('refresh-2')).toHaveTextContent('false');

      // 1つ目のコンポーネントの refreshGoals を実行
      getByTestId('refresh-button-1').click();
      await waitFor(() => {
        expect(getByTestId('refresh-1')).toHaveTextContent('true');
      });

      // 2つ目のコンポーネントの状態は変更されていないことを確認
      expect(getByTestId('refresh-2')).toHaveTextContent('false');

      // 2つ目のコンポーネントの refreshGoals を実行
      getByTestId('refresh-button-2').click();
      await waitFor(() => {
        expect(getByTestId('refresh-2')).toHaveTextContent('true');
      });

      // 1つ目のコンポーネントの状態は変更されていないことを確認
      expect(getByTestId('refresh-1')).toHaveTextContent('true');
    });
  });

  describe('コンテキストの提供', () => {
    it('コンテキストの値が正しい型であること', () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const { refresh, refreshGoals, goalsState, setGoalsState } = useGoals();
        return (
          <div>
            <div data-testid="refresh-type">{typeof refresh}</div>
            <div data-testid="refreshGoals-type">{typeof refreshGoals}</div>
            <div data-testid="goalsState-type">{Array.isArray(goalsState) ? 'array' : typeof goalsState}</div>
            <div data-testid="setGoalsState-type">{typeof setGoalsState}</div>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 各値の型を確認
      expect(getByTestId('refresh-type')).toHaveTextContent('boolean');
      expect(getByTestId('refreshGoals-type')).toHaveTextContent('function');
      expect(getByTestId('goalsState-type')).toHaveTextContent('array');
      expect(getByTestId('setGoalsState-type')).toHaveTextContent('function');
    });

    it('useGoals フックが正しくコンテキストの値を返すこと', () => {
      // テスト用のコンポーネント
      const TestComponent = () => {
        const context = useGoals();
        return (
          <div>
            <div data-testid="context-keys">{Object.keys(context).join(',')}</div>
          </div>
        );
      };

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <GoalsProvider>
          <TestComponent />
        </GoalsProvider>
      );

      // 必要な値が全て提供されていることを確認
      expect(getByTestId('context-keys')).toHaveTextContent('refresh,refreshGoals,goalsState,setGoalsState');
    });

  describe('エラーケース', () => {
    it('コンテキストの外で useGoals を使用すると undefined が返ること', () => {
    // テスト用のコンポーネント
      const TestComponent = () => {
        const context = useGoals();
        return <div>{String(context)}</div>;
      };

      // プロバイダーなしでコンポーネントをレンダリング
      const { container } = render(<TestComponent />);

      // useGoals が undefined を返すことを確認
      expect(container.textContent).toBe('undefined');
    });

    it('配列以外を渡すとエラーを出し、state は変わらない', () => {
      /* ───── console.error を監視 ───── */
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
  
      /* ───── Provider でフックを実行 ───── */
      const { result } = renderHook(() => useGoals(), {
        wrapper: GoalsProvider,
      });
  
      /* 初期 state は [] */
      expect(result.current.goalsState).toEqual([]);
  
      /* ───── 不正な値をセット ───── */
      // 文字列を渡してみる（配列でない）
      result.current.setGoalsState('bad value');
  
      /* (1) console.error が呼ばれたか？ */
      expect(consoleSpy).toHaveBeenCalledWith(
        'goalsState must be an array:',
        'bad value'
      );
  
      /* (2) state が更新されていないか？ */
      expect(result.current.goalsState).toEqual([]);
  
      consoleSpy.mockRestore();
    });

      it('refreshGoals を連続で呼び出してもエラーにならないこと', async () => {
        // テスト用のコンポーネント
        const TestComponent = () => {
          const { refresh, refreshGoals } = useGoals();
          return (
            <div>
              <div data-testid="refresh">{refresh.toString()}</div>
              <button 
                onClick={() => {
                  refreshGoals();
                  refreshGoals();
                  refreshGoals();
                }} 
                data-testid="multiple-refresh-button"
              >
                Multiple Refresh
              </button>
            </div>
          );
        };

        // プロバイダーでラップしてレンダリング
        const { getByTestId } = render(
          <GoalsProvider>
            <TestComponent />
          </GoalsProvider>
        );

        // 初期状態を確認
        expect(getByTestId('refresh')).toHaveTextContent('false');

        // 連続で refreshGoals を呼び出す
        getByTestId('multiple-refresh-button').click();

        // 最後の状態が正しいことを確認
        await waitFor(() => {
          expect(getByTestId('refresh')).toHaveTextContent('true');
        });
      });
    });
  });
});