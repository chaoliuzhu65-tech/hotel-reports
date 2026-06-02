#!/bin/bash
# 德胧酒店SKILL包一键安装脚本
# 版本：v1.0 | 日期：2026-06-02

echo "🦞 德胧酒店SKILL包安装程序"
echo "========================="

# 检查OpenClaw技能目录
SKILL_DIR="$HOME/.openclaw/skills"
if [ ! -d "$SKILL_DIR" ]; then
    echo "❌ 未找到OpenClaw技能目录：$SKILL_DIR"
    echo "请先安装OpenClaw"
    exit 1
fi

# 创建备份
BACKUP_DIR="$HOME/.openclaw/skills-backup-$(date +%Y%m%d)"
echo "📦 创建备份到：$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 安装宣推SKILL
echo ""
echo "📱 安装宣推内容生产SKILL..."
for skill in hotel-xuantui dlx-copywriting humanizer-zh; do
    if [ -d "skills/xuantui/$skill" ]; then
        cp -r "skills/xuantui/$skill" "$SKILL_DIR/"
        echo "✅ 已安装：$skill"
    else
        echo "⚠️  未找到：$skill"
    fi
done

# 安装市场探针SKILL
echo ""
echo "🔍 安装市场探针调研SKILL..."
for skill in market-probe dlx-competitive-analysis; do
    if [ -d "skills/market-probe/$skill" ]; then
        cp -r "skills/market-probe/$skill" "$SKILL_DIR/"
        echo "✅ 已安装：$skill"
    else
        echo "⚠️  未找到：$skill"
    fi
done

echo ""
echo "🎉 安装完成！"
echo "请重启OpenClaw使SKILL生效"
echo ""
echo "📖 使用文档：https://chaoliuzhu65-tech.github.io/hotel-reports"
echo "💬 问题反馈：飞书群@小柱 或联系晁总"
