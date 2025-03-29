# AutoLang 初期设计

C++ 从诞生到现在已经过了 45 年。作为上一代编程语言的代表，C++ 对编程语言设计的探索贡献颇多，但受制于回溯兼容等原因，C++ 逐渐变得又庞大又复杂，处处充满割裂而又难以掌握。包括 Golang、Rust、Zig 在内的新一代语言也在一步一步挤占 C++ 的市场占有率，甚至是污染社区生态。

C++ 需要一次自救，这条自救的道路需从 C++ 自身中寻找，但又要脱离出 C++ 自身。为了保证兼容性，C++ 难以做出破坏性更新，尽管它必须做，但理论与现实必然存在偏差。

这便是 AutoLang 诞生的目的：还原出 C++ 该有的模样，修正 C++ 犯下的历史错误，若有能力也可以反过来推动 C++ 的变革。

## 自我定位

AutoLang 是什么：

- AutoLang 是改良版的 C++
- AutoLang 是激进派
- AutoLang 是多范式并存的
- AutoLang 是 C++ 生态的共生体
- AutoLang 是实用主义的践行者
- AutoLang 是社区的自由画布

AutoLang 不是什么：

- AutoLang 不是第二个 Rust
- AutoLang 不抛弃历史
- AutoLang 不是 C++ 的替代品
- AutoLang 不是学术玩具
- AutoLang 不放弃性能
- AutoLang 不制造生态孤岛

## 设计哲学

> 谦逊如尘土，实用如利刃。

- 零开销
- 多范式
- 无限信任与无限自由

## 发展道路

AutoLang 想要成为 C++ 的 TypeScript，它会与 C++ 共存，并允许高度的互操作。AutoLang 对 C++ 的改良主要集中在下面的方面（排名不分先后）：

- [异常](exceptions)
  - 零开销异常
  - 统一的异常类型
  - 不抛出的动态内存分配和特殊函数
- [值类别](value-category)
- [所有权转移](move)
  - 取用语义
  - 移动语义
- [类型推导](type-deduction)
- [编译期计算](consteval)
  - 100% 编译期计算
  - 非瞬态编译期分配
- [模块](modules)
- [静态反射](reflect)
- [契约](contract)
  - 前后条件、断言
  - 不变式
  - 加固标准库
- [初始化](initialization)
  - 构造函数
    - 同名构造函数
    - 工厂构造函数
  - 无歧义的初始化列表语法
  - 统一初始化
- [转发](forwarding)
- [用户定义的协变规则](covariant)
- [元编程](metaprogramming)
- [宏](macros)
- [语句表达式](statement-expressions)
- [语句块](statement-blocks)
  - `main` 块
  - `scope_exit` `scope_fail` `scope_success` 块
  - `synchronized` 块
  - 原子块
- [类型特征](traits)
- [非侵入式多态](proxy)
- [值语义多态](value-semantic-polymorphism)
- [Tagged Unions](tagged-unions)
- [模式匹配](pattern-matching)
  - 顺序匹配和无序匹配
  - 基于模式匹配的重载决议和模板
  - 重载决议消歧义
- [名字耦合](name-coupling)
  - 弱化实参依赖查找
  - 类型特征
- [零大小类型](zero-sized-types)
- [兼容 C++](cpp)

更粗略地说：

- 安全方面：
  - 不走 Rust 的路
  - 不追求 Sound
  - 使用契约编程等实现“顺手为之”的安全
- 语法方面：
  - 简化语法结构，除了关键词
  - 推荐的范式写起来简单，不推荐的范式写起来麻烦
  - 不吝啬于引入关键词，但放松关键词作为名字的限制
  - 提供消除二义性的语法
  - `auto`
- 语义方面：
  - 尽量消除特例
  - 消除二义性
  - 减少随实现而定的行为和未定义行为
- 源码组织方面：
  - 模块
  - 自描述的构建脚本
  - 包管理

上面的列表中，许多东西都被 Golang、Zig、Rust、Nim 等新一代语言抛弃了，但我认为它们有存在的价值；有许多东西是其他语言所没有的，我也将其纳入；当然更多东西会参考新一代语言。我希望 AutoLang 能够凭借这些特性，与其他语言打出差分。

AutoLang 的核心设计（包括名字）大多直接或间接来自于现有的 C++ 或提案，从而它实际上体现的是我对 C++ 的所有理解。
