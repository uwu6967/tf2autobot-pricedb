import { parseCartItemParams, parseItemAndAmountFromMessage } from '../../../Commands/functions/utils';

it('can parse one word item names', () => {
    let messageArgs = '5 Maul';
    let parsedMessage = parseItemAndAmountFromMessage(messageArgs);
    expect(parsedMessage).toEqual({ name: 'Maul', amount: 5 });

    messageArgs = 'Maul';
    parsedMessage = parseItemAndAmountFromMessage(messageArgs);
    expect(parsedMessage).toEqual({ name: 'Maul', amount: 1 });
});

it('can parse multiple word item names', () => {
    let messageArgs = '5 Nostromo Napalmer';
    let parsedMessage = parseItemAndAmountFromMessage(messageArgs);
    expect(parsedMessage).toEqual({ name: 'Nostromo Napalmer', amount: 5 });

    messageArgs = 'Nostromo Napalmer';
    parsedMessage = parseItemAndAmountFromMessage(messageArgs);
    expect(parsedMessage).toEqual({ name: 'Nostromo Napalmer', amount: 1 });
});

it('can parse cart item params for withdraw/deposit', () => {
    expect(parseCartItemParams('1 sku=1157;6')).toEqual({ sku: '1157;6', amount: 1 });
    expect(parseCartItemParams('sku=1157;6&amount=1')).toEqual({ sku: '1157;6', amount: 1 });
    expect(parseCartItemParams('1 Taunt: Kazotsky Kick')).toEqual({ item: 'Taunt: Kazotsky Kick', amount: 1 });
    expect(parseCartItemParams('name=Taunt: Kazotsky Kick&amount=1')).toEqual({
        name: 'Taunt: Kazotsky Kick',
        amount: 1
    });
});
