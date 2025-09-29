% Historical Consanguineous Marriages in the Habsburg Dynasty

% Uncle-Niece Marriages
marriage(philip_ii_spain, anna_of_austria, 1570, uncle_niece).
marriage(philip_iv_spain, maria_anna_of_austria, 1649, uncle_niece).
marriage(philip_iv_spain, maria_anna_of_austria, parents_of_charles_ii, uncle_niece).

% First Cousin Marriages
marriage(marie_antoinette, louis_xvi, 1770, first_cousin).

% Rules to Identify Consanguineous Marriages
consanguinity(X, Y, Level) :- 
    (X = uncle, Y = niece -> Level = uncle_niece;
    X = first_cousin, Y = first_cousin -> Level = first_cousin;
    % Add more rules for sibling, etc.
    Level = unknown).
