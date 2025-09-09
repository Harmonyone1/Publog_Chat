from __future__ import annotations
"""
NOTE: This file is a local stub used for typing/examples only.
It is NOT the production backend used by the Chat UI.

The deployed API Gateway /ask route integrates with the Lambda
function named `publog-nlsql`, which generates SQL via Bedrock
and queries Athena through the `publog-athena-proxy` Lambda.

Do not deploy this stub to AWS for production; it returns
hardcoded responses for demonstration.
"""
import json
from typing import Any, TypedDict, List, Optional, Literal


class Column(TypedDict, total=False):
    name: str
    type: Optional[str]


class ResultSet(TypedDict):
    columns: List[Column]
    rows: List[List[Any]]


class ChatResponse(TypedDict):
    mode: Literal['chat']
    answer: str
    sql: Optional[str]
    result: Optional[ResultSet]


class SqlResponse(TypedDict):
    mode: Literal['sql']
    answer: Optional[str]
    sql: str
    result: ResultSet


class AskResponse(TypedDict):
    mode: Literal['chat', 'sql']
    answer: Optional[str]
    sql: Optional[str]
    result: Optional[ResultSet]


FALLBACK_ERROR = "Sorry, something went wrong."


def classify_intent(question: str) -> Literal['chat', 'sql']:
    q = question.lower()
    return 'sql' if 'select' in q or 'sql' in q else 'chat'


def _hoist_order_by_limit(sql: str) -> str:
    return sql


def _bedrock_sql(question: str) -> tuple[str, ResultSet]:
    sql = "SELECT 1 AS example"
    result: ResultSet = {
        'columns': [{'name': 'example', 'type': 'int'}],
        'rows': [[1]],
    }
    return sql, result


def chat_answer(question: str) -> str:
    return f"Echo: {question}"


def _validate_chat(resp: Any) -> bool:
    return (
        isinstance(resp, dict)
        and resp.get('mode') == 'chat'
        and isinstance(resp.get('answer'), str)
    )


def _validate_sql(resp: Any) -> bool:
    if not (
        isinstance(resp, dict)
        and resp.get('mode') == 'sql'
        and isinstance(resp.get('sql'), str)
        and isinstance(resp.get('result'), dict)
    ):
        return False
    result = resp['result']
    if not isinstance(result.get('columns'), list) or not isinstance(result.get('rows'), list):
        return False
    for col in result['columns']:
        if 'name' not in col:
            return False
    return True


def handler(event: dict, context: Any) -> dict:
    question = ''
    if isinstance(event, dict):
        body = event.get('body') or event
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except Exception:
                body = {}
        if isinstance(body, dict):
            question = body.get('question', '')

    try:
        intent = classify_intent(question)
        if intent == 'sql':
            sql, result = _bedrock_sql(question)
            sql = _hoist_order_by_limit(sql)
            resp: AskResponse = {'mode': 'sql', 'answer': None, 'sql': sql, 'result': result}
        else:
            answer = chat_answer(question)
            resp = {'mode': 'chat', 'answer': answer, 'sql': None, 'result': None}
    except Exception:
        resp = {'mode': 'chat', 'answer': FALLBACK_ERROR, 'sql': None, 'result': None}

    if not (_validate_chat(resp) or _validate_sql(resp)):
        resp = {'mode': 'chat', 'answer': FALLBACK_ERROR, 'sql': None, 'result': None}

    if resp['mode'] == 'chat':
        resp.setdefault('sql', None)
        resp.setdefault('result', None)
    else:
        resp.setdefault('answer', None)
        result = resp.get('result')
        if isinstance(result, dict):
            result.setdefault('columns', [])
            result.setdefault('rows', [])
        else:
            resp['result'] = {'columns': [], 'rows': []}

    return {'statusCode': 200, 'body': json.dumps(resp)}
